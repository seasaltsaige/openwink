#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <esp_sleep.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>
#include <stdlib.h>

#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "command_output.h"
#include "headlight_feedback.h"
#include "module_settings.h"
#include "output_handler.h"
#include "storage_handler.h"

static const char* TAG = "FBK";

TaskHandle_t left_feedback_task;
TaskHandle_t right_feedback_task;

RTC_DATA_ATTR feedback_stats_t movement_stats = {
    .left_move_time = DEFAULT_MOVE_TIME_MS,
    .right_move_time = DEFAULT_MOVE_TIME_MS,
    .left_up_move_time = DEFAULT_MOVE_TIME_MS,
    .left_down_move_time = DEFAULT_MOVE_TIME_MS,
    .right_up_move_time = DEFAULT_MOVE_TIME_MS,
    .right_down_move_time = DEFAULT_MOVE_TIME_MS,
    .left_moving = 0,
    .right_moving = 0,
};

RTC_DATA_ATTR static uint16_t last_nvs_left_up_time = DEFAULT_MOVE_TIME_MS;
RTC_DATA_ATTR static uint16_t last_nvs_left_down_time = DEFAULT_MOVE_TIME_MS;
RTC_DATA_ATTR static uint16_t last_nvs_right_up_time = DEFAULT_MOVE_TIME_MS;
RTC_DATA_ATTR static uint16_t last_nvs_right_down_time = DEFAULT_MOVE_TIME_MS;

static volatile uint8_t sleepy_sequence_ignore = 0;
static volatile uint8_t left_allow_cal = 0;
static volatile uint8_t right_allow_cal = 0;
static volatile uint8_t left_blank_startup = 0;
static volatile uint8_t right_blank_startup = 0;
static volatile move_type_t left_active_dir = MOVE_UP;
static volatile move_type_t right_active_dir = MOVE_UP;
static volatile int64_t left_move_start_us = 0;
static volatile int64_t right_move_start_us = 0;

EventGroupHandle_t movement_event;

void monitor_event_group_init() {
    movement_event = xEventGroupCreate();
    xEventGroupSetBits(movement_event, (LEFT_STOPPED_BIT | RIGHT_STOPPED_BIT));
    xEventGroupClearBits(movement_event, (LEFT_STARTED_BIT | RIGHT_STARTED_BIT));
}

void monitor_gpio_init() {

    gpio_config_t feedback_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pin_bit_mask = (1ULL << LEFT_MONITOR_PIN | 1ULL << RIGHT_MONITOR_PIN),
    };
    gpio_config(&feedback_config);

    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED)
        reload_move_times();
}

void reload_move_times() {
    uint16_t lu = 0, ld = 0, ru = 0, rd = 0;
    get_nvs_left_up_move_time(&lu);
    get_nvs_left_down_move_time(&ld);
    get_nvs_right_up_move_time(&ru);
    get_nvs_right_down_move_time(&rd);

    if (lu < MOVE_TIME_MIN_MS || lu > MOVE_TIME_LIMIT_MS) {
        lu = DEFAULT_MOVE_TIME_MS;
        set_nvs_left_up_move_time(DEFAULT_MOVE_TIME_MS);
    }
    if (ld < MOVE_TIME_MIN_MS || ld > MOVE_TIME_LIMIT_MS) {
        ld = DEFAULT_MOVE_TIME_MS;
        set_nvs_left_down_move_time(DEFAULT_MOVE_TIME_MS);
    }
    if (ru < MOVE_TIME_MIN_MS || ru > MOVE_TIME_LIMIT_MS) {
        ru = DEFAULT_MOVE_TIME_MS;
        set_nvs_right_up_move_time(DEFAULT_MOVE_TIME_MS);
    }
    if (rd < MOVE_TIME_MIN_MS || rd > MOVE_TIME_LIMIT_MS) {
        rd = DEFAULT_MOVE_TIME_MS;
        set_nvs_right_down_move_time(DEFAULT_MOVE_TIME_MS);
    }

    movement_stats.left_up_move_time = lu;
    movement_stats.left_down_move_time = ld;
    movement_stats.right_up_move_time = ru;
    movement_stats.right_down_move_time = rd;

    movement_stats.left_move_time = (uint16_t)(((uint32_t)lu + (uint32_t)ld + 1) / 2);
    movement_stats.right_move_time = (uint16_t)(((uint32_t)ru + (uint32_t)rd + 1) / 2);
    set_nvs_left_move_time(movement_stats.left_move_time);
    set_nvs_right_move_time(movement_stats.right_move_time);

    last_nvs_left_up_time = lu;
    last_nvs_left_down_time = ld;
    last_nvs_right_up_time = ru;
    last_nvs_right_down_time = rd;
}

void swap_move_time_sides() {
    uint16_t tmp_time = movement_stats.left_move_time;
    movement_stats.left_move_time = movement_stats.right_move_time;
    movement_stats.right_move_time = tmp_time;

    uint16_t tmp_up = movement_stats.left_up_move_time;
    movement_stats.left_up_move_time = movement_stats.right_up_move_time;
    movement_stats.right_up_move_time = tmp_up;

    uint16_t tmp_down = movement_stats.left_down_move_time;
    movement_stats.left_down_move_time = movement_stats.right_down_move_time;
    movement_stats.right_down_move_time = tmp_down;

    last_nvs_left_up_time = movement_stats.left_up_move_time;
    last_nvs_left_down_time = movement_stats.left_down_move_time;
    last_nvs_right_up_time = movement_stats.right_up_move_time;
    last_nvs_right_down_time = movement_stats.right_down_move_time;

    set_nvs_left_move_time(movement_stats.left_move_time);
    set_nvs_right_move_time(movement_stats.right_move_time);
    set_nvs_left_up_move_time(movement_stats.left_up_move_time);
    set_nvs_left_down_move_time(movement_stats.left_down_move_time);
    set_nvs_right_up_move_time(movement_stats.right_up_move_time);
    set_nvs_right_down_move_time(movement_stats.right_down_move_time);
}

void set_sleepy_sequence_ignore(uint8_t ignore) {
    sleepy_sequence_ignore = ignore ? 1 : 0;
    if (sleepy_sequence_ignore) {
        left_allow_cal = 0;
        right_allow_cal = 0;
    }
}

uint8_t get_sleepy_sequence_ignore() {
    return sleepy_sequence_ignore;
}

void set_side_move_context(uint8_t side_bit, move_type_t move_dir, uint8_t allow_cal, uint8_t blank_startup) {
    uint8_t effective_cal = (allow_cal && !sleepy_sequence_ignore) ? 1 : 0;
    if (side_bit == LEFT_SIDE) {
        left_active_dir = move_dir;
        left_allow_cal = effective_cal;
        left_blank_startup = blank_startup ? 1 : 0;
    } else if (side_bit == RIGHT_SIDE) {
        right_active_dir = move_dir;
        right_allow_cal = effective_cal;
        right_blank_startup = blank_startup ? 1 : 0;
    }
}

int64_t get_side_move_start_us(uint8_t side_bit) {
    return (side_bit == LEFT_SIDE) ? left_move_start_us : right_move_start_us;
}

uint16_t get_left_move_time_ms() {
    return movement_stats.left_move_time;
}

uint16_t get_right_move_time_ms() {
    return movement_stats.right_move_time;
}

uint16_t get_side_move_time_ms(uint8_t side_bit, move_type_t move_dir) {
    if (side_bit == LEFT_SIDE)
        return (move_dir == MOVE_DOWN) ? movement_stats.left_down_move_time : movement_stats.left_up_move_time;
    else
        return (move_dir == MOVE_DOWN) ? movement_stats.right_down_move_time : movement_stats.right_up_move_time;
}

void left_monitor_task(void* args) {
    int64_t move_start = 0;
    int64_t stop_start = 0;
    uint8_t last_level = 0;
    uint8_t high_streak = 0;
    uint8_t low_streak = 0;
    uint8_t move_cal_allowed = 0;
    uint8_t move_blank_startup = 0;
    move_type_t move_dir_latched = MOVE_UP;
    gpio_num_t active_pin = LEFT_MONITOR_PIN;
    for (;;) {
        if (last_level == 0)
            active_pin = (get_module_orientation() == ORIENTATION_SWAPPED) ? RIGHT_MONITOR_PIN : LEFT_MONITOR_PIN;
        uint8_t curr_state = gpio_get_level(active_pin);
        // movement start (debounced rising edge)
        if (last_level == 0) {
            if (curr_state == 1) {
                if (high_streak == 0)
                    move_start = esp_timer_get_time();
                high_streak++;
                if (high_streak >= FEEDBACK_START_DEBOUNCE_COUNT) {
                    last_level = 1;
                    high_streak = 0;
                    low_streak = 0;
                    movement_stats.left_moving = 1;
                    left_move_start_us = move_start;
                    move_cal_allowed = left_allow_cal && !sleepy_sequence_ignore && !is_left_sleepy();
                    move_blank_startup = left_blank_startup;
                    move_dir_latched = left_active_dir;
                    xEventGroupSetBits(movement_event, LEFT_STARTED_BIT);
                    BLE_LOGV(TAG, "LEFT feedback active (dir=%s, cal=%u, blank=%u)", move_type_to_str(move_dir_latched), move_cal_allowed, move_blank_startup);
                }
            } else {
                high_streak = 0;
            }
        } else {
            if (curr_state == 0) {
                uint8_t allow_cal = move_cal_allowed && left_allow_cal && !sleepy_sequence_ignore && !is_left_sleepy();
                int64_t now_us = esp_timer_get_time();
                uint16_t since_start_ms = (uint16_t)((now_us - move_start) / 1000);

                if (move_blank_startup && since_start_ms < MOVE_STOP_BLANK_MS) {
                    low_streak = 0;
                } else {
                    if (low_streak == 0)
                        stop_start = now_us;
                    low_streak++;

                    if (low_streak >= FEEDBACK_STOP_DEBOUNCE_COUNT) {
                        last_level = 0;
                        low_streak = 0;
                        high_streak = 0;
                        movement_stats.left_moving = 0;
                        move_cal_allowed = 0;
                        move_blank_startup = 0;
                        left_allow_cal = 0;
                        left_blank_startup = 0;

                        uint8_t time_updated = 0;
                        uint16_t elapsed_ms = 0;
                        if (allow_cal) {
                            // move time in ms (measured from start of rising edge to start of confirmed falling edge)
                            elapsed_ms = (uint16_t)((stop_start - move_start) / 1000);
                            if (elapsed_ms >= MOVE_TIME_MIN_MS && elapsed_ms <= MOVE_TIME_LIMIT_MS) {
                                if (move_dir_latched == MOVE_DOWN)
                                    movement_stats.left_down_move_time = elapsed_ms;
                                else
                                    movement_stats.left_up_move_time = elapsed_ms;
                                movement_stats.left_move_time = (uint16_t)(((uint32_t)movement_stats.left_up_move_time + (uint32_t)movement_stats.left_down_move_time + 1) / 2);
                                time_updated = 1;
                            }
                        }

                        xEventGroupSetBits(movement_event, LEFT_STOPPED_BIT);

                        if (allow_cal) {
                            if (time_updated) {
                                BLE_LOGD(TAG, "LEFT %s feedback stop: %ums", move_type_to_str(move_dir_latched), elapsed_ms);
                                if (move_dir_latched == MOVE_DOWN) {
                                    if (abs((int)elapsed_ms - (int)last_nvs_left_down_time) >= MOVE_TIME_DEADBAND_MS) {
                                        last_nvs_left_down_time = elapsed_ms;
                                        set_nvs_left_down_move_time(elapsed_ms);
                                        set_nvs_left_move_time(movement_stats.left_move_time);
                                        BLE_LOGI(TAG, "LEFT DOWN move time calibrated: %ums (saved)", elapsed_ms);
                                    }
                                } else {
                                    if (abs((int)elapsed_ms - (int)last_nvs_left_up_time) >= MOVE_TIME_DEADBAND_MS) {
                                        last_nvs_left_up_time = elapsed_ms;
                                        set_nvs_left_up_move_time(elapsed_ms);
                                        set_nvs_left_move_time(movement_stats.left_move_time);
                                        BLE_LOGI(TAG, "LEFT UP move time calibrated: %ums (saved)", elapsed_ms);
                                    }
                                }
                                if (!get_command_busy())
                                    ble_notify_headlight_status();
                            } else
                                BLE_LOGW(TAG, "LEFT move time %ums out of bounds (%u..%ums)", elapsed_ms, MOVE_TIME_MIN_MS, MOVE_TIME_LIMIT_MS);
                        } else
                            BLE_LOGD(TAG, "LEFT feedback stop (sleepy/non-cal, cal skipped)");
                    }
                }
            } else {
                if (low_streak > 0)
                    BLE_LOGV(TAG, "LEFT feedback glitch rejected (%u low samples)", low_streak);
                low_streak = 0;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(4));
    }
}

void right_monitor_task(void* args) {
    int64_t move_start = 0;
    int64_t stop_start = 0;
    uint8_t last_level = 0;
    uint8_t high_streak = 0;
    uint8_t low_streak = 0;
    uint8_t move_cal_allowed = 0;
    uint8_t move_blank_startup = 0;
    move_type_t move_dir_latched = MOVE_UP;
    gpio_num_t active_pin = RIGHT_MONITOR_PIN;
    for (;;) {
        if (last_level == 0)
            active_pin = (get_module_orientation() == ORIENTATION_SWAPPED) ? LEFT_MONITOR_PIN : RIGHT_MONITOR_PIN;
        uint8_t curr_state = gpio_get_level(active_pin);
        // movement start (debounced rising edge)
        if (last_level == 0) {
            if (curr_state == 1) {
                if (high_streak == 0)
                    move_start = esp_timer_get_time();
                high_streak++;
                if (high_streak >= FEEDBACK_START_DEBOUNCE_COUNT) {
                    last_level = 1;
                    high_streak = 0;
                    low_streak = 0;
                    movement_stats.right_moving = 1;
                    right_move_start_us = move_start;
                    move_cal_allowed = right_allow_cal && !sleepy_sequence_ignore && !is_right_sleepy();
                    move_blank_startup = right_blank_startup;
                    move_dir_latched = right_active_dir;
                    xEventGroupSetBits(movement_event, RIGHT_STARTED_BIT);
                    BLE_LOGV(TAG, "RIGHT feedback active (dir=%s, cal=%u, blank=%u)", move_type_to_str(move_dir_latched), move_cal_allowed, move_blank_startup);
                }
            } else {
                high_streak = 0;
            }
        } else {
            if (curr_state == 0) {
                uint8_t allow_cal = move_cal_allowed && right_allow_cal && !sleepy_sequence_ignore && !is_right_sleepy();
                int64_t now_us = esp_timer_get_time();
                uint16_t since_start_ms = (uint16_t)((now_us - move_start) / 1000);

                if (move_blank_startup && since_start_ms < MOVE_STOP_BLANK_MS) {
                    low_streak = 0;
                } else {
                    if (low_streak == 0)
                        stop_start = now_us;
                    low_streak++;

                    if (low_streak >= FEEDBACK_STOP_DEBOUNCE_COUNT) {
                        last_level = 0;
                        low_streak = 0;
                        high_streak = 0;
                        movement_stats.right_moving = 0;
                        move_cal_allowed = 0;
                        move_blank_startup = 0;
                        right_allow_cal = 0;
                        right_blank_startup = 0;

                        uint8_t time_updated = 0;
                        uint16_t elapsed_ms = 0;
                        if (allow_cal) {
                            // move time in ms (measured from start of rising edge to start of confirmed falling edge)
                            elapsed_ms = (uint16_t)((stop_start - move_start) / 1000);
                            if (elapsed_ms >= MOVE_TIME_MIN_MS && elapsed_ms <= MOVE_TIME_LIMIT_MS) {
                                if (move_dir_latched == MOVE_DOWN)
                                    movement_stats.right_down_move_time = elapsed_ms;
                                else
                                    movement_stats.right_up_move_time = elapsed_ms;
                                movement_stats.right_move_time = (uint16_t)(((uint32_t)movement_stats.right_up_move_time + (uint32_t)movement_stats.right_down_move_time + 1) / 2);
                                time_updated = 1;
                            }
                        }

                        xEventGroupSetBits(movement_event, RIGHT_STOPPED_BIT);

                        if (allow_cal) {
                            if (time_updated) {
                                BLE_LOGD(TAG, "RIGHT %s feedback stop: %ums", move_type_to_str(move_dir_latched), elapsed_ms);
                                if (move_dir_latched == MOVE_DOWN) {
                                    if (abs((int)elapsed_ms - (int)last_nvs_right_down_time) >= MOVE_TIME_DEADBAND_MS) {
                                        last_nvs_right_down_time = elapsed_ms;
                                        set_nvs_right_down_move_time(elapsed_ms);
                                        set_nvs_right_move_time(movement_stats.right_move_time);
                                        BLE_LOGI(TAG, "RIGHT DOWN move time calibrated: %ums (saved)", elapsed_ms);
                                    }
                                } else {
                                    if (abs((int)elapsed_ms - (int)last_nvs_right_up_time) >= MOVE_TIME_DEADBAND_MS) {
                                        last_nvs_right_up_time = elapsed_ms;
                                        set_nvs_right_up_move_time(elapsed_ms);
                                        set_nvs_right_move_time(movement_stats.right_move_time);
                                        BLE_LOGI(TAG, "RIGHT UP move time calibrated: %ums (saved)", elapsed_ms);
                                    }
                                }
                                if (!get_command_busy())
                                    ble_notify_headlight_status();
                            } else
                                BLE_LOGW(TAG, "RIGHT move time %ums out of bounds (%u..%ums)", elapsed_ms, MOVE_TIME_MIN_MS, MOVE_TIME_LIMIT_MS);
                        } else
                            BLE_LOGD(TAG, "RIGHT feedback stop (sleepy/non-cal, cal skipped)");
                    }
                }
            } else {
                if (low_streak > 0)
                    BLE_LOGV(TAG, "RIGHT feedback glitch rejected (%u low samples)", low_streak);
                low_streak = 0;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(4));
    }
}
