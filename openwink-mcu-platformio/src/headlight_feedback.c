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
    .left_moving = 0,
    .right_moving = 0,
};

RTC_DATA_ATTR static uint16_t last_nvs_left_time = DEFAULT_MOVE_TIME_MS;
RTC_DATA_ATTR static uint16_t last_nvs_right_time = DEFAULT_MOVE_TIME_MS;

EventGroupHandle_t movement_event;

void monitor_event_group_init() {
    movement_event = xEventGroupCreate();
    xEventGroupSetBits(movement_event, (LEFT_STOPPED_BIT | RIGHT_STOPPED_BIT));
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
    get_nvs_left_move_time(&movement_stats.left_move_time);
    get_nvs_right_move_time(&movement_stats.right_move_time);
    if (movement_stats.left_move_time < MOVE_TIME_MIN_MS || movement_stats.left_move_time > MOVE_TIME_LIMIT_MS) {
        movement_stats.left_move_time = DEFAULT_MOVE_TIME_MS;
        set_nvs_left_move_time(DEFAULT_MOVE_TIME_MS);
    }
    if (movement_stats.right_move_time < MOVE_TIME_MIN_MS || movement_stats.right_move_time > MOVE_TIME_LIMIT_MS) {
        movement_stats.right_move_time = DEFAULT_MOVE_TIME_MS;
        set_nvs_right_move_time(DEFAULT_MOVE_TIME_MS);
    }
    last_nvs_left_time = movement_stats.left_move_time;
    last_nvs_right_time = movement_stats.right_move_time;
}

void swap_move_time_sides() {
    uint16_t tmp_time = movement_stats.left_move_time;
    movement_stats.left_move_time = movement_stats.right_move_time;
    movement_stats.right_move_time = tmp_time;

    last_nvs_left_time = movement_stats.left_move_time;
    last_nvs_right_time = movement_stats.right_move_time;
    set_nvs_left_move_time(movement_stats.left_move_time);
    set_nvs_right_move_time(movement_stats.right_move_time);
}

uint16_t get_left_move_time_ms() {
    return movement_stats.left_move_time;
}

uint16_t get_right_move_time_ms() {
    return movement_stats.right_move_time;
}

void left_monitor_task(void* args) {
    int64_t move_start = 0;
    int64_t stop_start = 0;
    uint8_t last_level = 0;
    uint8_t high_streak = 0;
    uint8_t low_streak = 0;
    uint8_t move_started_sleepy = 0;
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
                    move_started_sleepy = is_left_sleepy();
                    BLE_LOGV(TAG, "LEFT feedback active (sleepy=%u)", move_started_sleepy);
                }
            } else {
                high_streak = 0;
            }
        } else {
            if (curr_state == 0) {
                uint8_t sleepy = move_started_sleepy || is_left_sleepy();
                int64_t now_us = esp_timer_get_time();
                uint16_t since_start_ms = (uint16_t)((now_us - move_start) / 1000);

                if (!sleepy && since_start_ms < MOVE_STOP_BLANK_MS) {
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
                        move_started_sleepy = 0;

                        uint8_t time_updated = 0;
                        uint16_t elapsed_ms = 0;
                        if (!sleepy) {
                            // move time in ms (measured from start of rising edge to start of confirmed falling edge)
                            elapsed_ms = (uint16_t)((stop_start - move_start) / 1000);
                            if (elapsed_ms >= MOVE_TIME_MIN_MS && elapsed_ms <= MOVE_TIME_LIMIT_MS) {
                                movement_stats.left_move_time = elapsed_ms;
                                time_updated = 1;
                            }
                        }

                        xEventGroupSetBits(movement_event, LEFT_STOPPED_BIT);

                        if (!sleepy) {
                            if (time_updated) {
                                BLE_LOGD(TAG, "LEFT feedback stop: %ums", elapsed_ms);
                                if (abs((int)elapsed_ms - (int)last_nvs_left_time) >= MOVE_TIME_DEADBAND_MS) {
                                    last_nvs_left_time = elapsed_ms;
                                    set_nvs_left_move_time(elapsed_ms);
                                    BLE_LOGI(TAG, "LEFT move time calibrated: %ums (saved)", elapsed_ms);
                                }
                                if (!get_command_busy())
                                    ble_notify_headlight_status();
                            } else
                                BLE_LOGW(TAG, "LEFT move time %ums out of bounds (%u..%ums)", elapsed_ms, MOVE_TIME_MIN_MS, MOVE_TIME_LIMIT_MS);
                        } else
                            BLE_LOGD(TAG, "LEFT feedback stop (sleepy, cal skipped)");
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
    uint8_t move_started_sleepy = 0;
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
                    move_started_sleepy = is_right_sleepy();
                    BLE_LOGV(TAG, "RIGHT feedback active (sleepy=%u)", move_started_sleepy);
                }
            } else {
                high_streak = 0;
            }
        } else {
            if (curr_state == 0) {
                uint8_t sleepy = move_started_sleepy || is_right_sleepy();
                int64_t now_us = esp_timer_get_time();
                uint16_t since_start_ms = (uint16_t)((now_us - move_start) / 1000);

                if (!sleepy && since_start_ms < MOVE_STOP_BLANK_MS) {
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
                        move_started_sleepy = 0;

                        uint8_t time_updated = 0;
                        uint16_t elapsed_ms = 0;
                        if (!sleepy) {
                            // move time in ms (measured from start of rising edge to start of confirmed falling edge)
                            elapsed_ms = (uint16_t)((stop_start - move_start) / 1000);
                            if (elapsed_ms >= MOVE_TIME_MIN_MS && elapsed_ms <= MOVE_TIME_LIMIT_MS) {
                                movement_stats.right_move_time = elapsed_ms;
                                time_updated = 1;
                            }
                        }

                        xEventGroupSetBits(movement_event, RIGHT_STOPPED_BIT);

                        if (!sleepy) {
                            if (time_updated) {
                                BLE_LOGD(TAG, "RIGHT feedback stop: %ums", elapsed_ms);
                                if (abs((int)elapsed_ms - (int)last_nvs_right_time) >= MOVE_TIME_DEADBAND_MS) {
                                    last_nvs_right_time = elapsed_ms;
                                    set_nvs_right_move_time(elapsed_ms);
                                    BLE_LOGI(TAG, "RIGHT move time calibrated: %ums (saved)", elapsed_ms);
                                }
                                if (!get_command_busy())
                                    ble_notify_headlight_status();
                            } else
                                BLE_LOGW(TAG, "RIGHT move time %ums out of bounds (%u..%ums)", elapsed_ms, MOVE_TIME_MIN_MS, MOVE_TIME_LIMIT_MS);
                        } else
                            BLE_LOGD(TAG, "RIGHT feedback stop (sleepy, cal skipped)");
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
