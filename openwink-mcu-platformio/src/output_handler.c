#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <esp_sleep.h>
#include <freertos/FreeRTOS.h>

#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "command_output.h"
#include "headlight_feedback.h"
#include "module_settings.h"
#include "output_handler.h"
#include "storage_handler.h"

static const char* TAG = "OUT";

QueueHandle_t left_output_queue;
QueueHandle_t right_output_queue;
EventGroupHandle_t output_event_group;

RTC_DATA_ATTR headlight_position_t positions = {
    .left_pos = 0,
    .right_pos = 0,
    .last_left_move_dir = MOVE_DOWN,
    .last_right_move_dir = MOVE_DOWN,
};

RTC_DATA_ATTR static uint8_t left_sleepy_target = 50;
RTC_DATA_ATTR static uint8_t right_sleepy_target = 50;

/**
 * Non-linear partial-move timing lookup tables (in permille, 0..1000 of calibrated move_time_ms),
 * indexed in 5% increments of target open position (0% = fully down, 100% = fully up).
 *
 * Derived from four-bar / slider-crank headlight linkage kinematics:
 *   tau(p) = tau_min + (tau_max - tau_min) * arccos(1 - 2*p) / pi
 * with directional deadband and coasting offsets:
 *   - UP (0% -> p%):     tau_min = 0.130, tau_max = 0.780
 *   - DOWN (100% -> p%): tau_min = 0.150, tau_max = 0.730
 *
 * Endpoints at index 0 (0%) and index 20 (100%) represent the physical lift/drop
 * threshold anchors for interpolating 1%..4% and 96%..99%.
 */
static const uint16_t sleepy_up_time_permille[SLEEPY_LUT_SIZE] = {
    130, //   0% (lift start threshold)
    223, //   5%
    263, //  10%
    295, //  15%
    322, //  20%
    347, //  25%
    370, //  30%
    392, //  35%
    413, //  40%
    434, //  45%
    455, //  50%
    476, //  55%
    497, //  60%
    518, //  65%
    540, //  70%
    563, //  75%
    588, //  80%
    615, //  85%
    647, //  90%
    687, //  95%
    780  // 100% (lift coast threshold)
};

static const uint16_t sleepy_down_time_permille[SLEEPY_LUT_SIZE] = {
    846, //   0% (drop coast threshold: 100% travel down from top)
    753, //   5% (95% travel down)
    713, //  10% (90% travel down)
    681, //  15% (85% travel down)
    654, //  20% (80% travel down)
    629, //  25% (75% travel down)
    606, //  30% (70% travel down)
    584, //  35% (65% travel down)
    563, //  40% (60% travel down)
    542, //  45% (55% travel down)
    521, //  50% (50% travel down)
    500, //  55% (45% travel down)
    479, //  60% (40% travel down)
    458, //  65% (35% travel down)
    436, //  70% (30% travel down)
    413, //  75% (25% travel down)
    388, //  80% (20% travel down)
    361, //  85% (15% travel down)
    329, //  90% (10% travel down)
    289, //  95% ( 5% travel down)
    196  // 100% (drop start threshold: 0% travel down from top)
};

static uint16_t get_avg_move_time_ms() {
    return (uint16_t)(((uint32_t)get_left_move_time_ms() + (uint32_t)get_right_move_time_ms() + 1) / 2);
}

static uint16_t get_partial_time_permille(uint8_t target_pos, move_type_t move_dir) {
    if (target_pos == POSITION_DOWN)
        return (move_dir == MOVE_UP) ? 0 : 1000;
    if (target_pos >= POSITION_UP)
        return (move_dir == MOVE_UP) ? 1000 : 0;

    const uint16_t* lut = (move_dir == MOVE_UP) ? sleepy_up_time_permille : sleepy_down_time_permille;
    uint8_t idx = target_pos / SLEEPY_LUT_STEP_PCT;
    uint8_t rem = target_pos % SLEEPY_LUT_STEP_PCT;

    if (rem == 0)
        return lut[idx];

    int32_t v0 = (int32_t)lut[idx];
    int32_t v1 = (int32_t)lut[idx + 1];
    int32_t diff = v1 - v0;
    int32_t interp = v0 + (diff * (int32_t)rem + (diff >= 0 ? 2 : -2)) / SLEEPY_LUT_STEP_PCT;
    return (uint16_t)interp;
}

static uint32_t compute_partial_move_delay_ms(uint16_t move_time_ms, uint8_t target_pos, move_type_t move_dir) {
    uint16_t permille = get_partial_time_permille(target_pos, move_dir);
    return ((uint32_t)move_time_ms * permille + 500) / 1000;
}

uint8_t is_left_sleepy() {
    return (positions.left_pos != POSITION_DOWN && positions.left_pos != POSITION_UP);
}

uint8_t is_right_sleepy() {
    return (positions.right_pos != POSITION_DOWN && positions.right_pos != POSITION_UP);
}


uint8_t validate_sleepy_values(const uint8_t* data, size_t size) {
    if (data == NULL)
        return 0;
    if (size != SLEEPY_PACKET_LEN)
        return 0;

    if (data[0] < MIN_SLEEPY_VALUE || data[0] > MAX_SLEEPY_VALUE || data[1] < MIN_SLEEPY_VALUE || data[1] > MAX_SLEEPY_VALUE)
        return 0;

    return 1;
}


void set_sleepy_eye_values(uint8_t left, uint8_t right) {
    if (left < MIN_SLEEPY_VALUE || left > MAX_SLEEPY_VALUE || right < MIN_SLEEPY_VALUE || right > MAX_SLEEPY_VALUE)
        return;

    left_sleepy_target = left;
    right_sleepy_target = right;
    set_nvs_left_sleepy_eye(left);
    set_nvs_right_sleepy_eye(right);

    BLE_LOGD(TAG, "Sleepy targets saved: L=%u%% R=%u%%", left, right);
}

void get_sleepy_eye_values(uint8_t* left, uint8_t* right) {
    if (left != NULL)
        *left = left_sleepy_target;
    if (right != NULL)
        *right = right_sleepy_target;
}

void outputs_init() {
    const gpio_config_t output_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pin_bit_mask = (1UL << OUT_PIN_LEFT_DOWN | 1UL << OUT_PIN_LEFT_UP | 1UL << OUT_PIN_RIGHT_DOWN | 1UL << OUT_PIN_RIGHT_UP),
    };
    // init output gpio and send all pins low to start
    gpio_config(&output_config);
    gpio_set_level(OUT_PIN_LEFT_DOWN, LOW);
    gpio_set_level(OUT_PIN_LEFT_UP, LOW);
    gpio_set_level(OUT_PIN_RIGHT_DOWN, LOW);
    gpio_set_level(OUT_PIN_RIGHT_UP, LOW);

    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED) {
        get_nvs_left_sleepy_eye(&left_sleepy_target);
        get_nvs_right_sleepy_eye(&right_sleepy_target);
    }
}

void output_queue_init() {
    left_output_queue = xQueueCreate(OUTPUT_QUEUE_LENGTH, sizeof(movement_target_t));
    right_output_queue = xQueueCreate(OUTPUT_QUEUE_LENGTH, sizeof(movement_target_t));
}

void output_event_group_init() {
    output_event_group = xEventGroupCreate();
    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
}

move_type_t start_side_move(output_args_t* motor_args, movement_target_t* move) {
    uint8_t swapped = (get_module_orientation() == ORIENTATION_SWAPPED);
    if ((motor_args->side_bit == LEFT_SIDE && !swapped) || (motor_args->side_bit == RIGHT_SIDE && swapped)) {
        motor_args->up_pin = OUT_PIN_LEFT_UP;
        motor_args->down_pin = OUT_PIN_LEFT_DOWN;
    } else {
        motor_args->up_pin = OUT_PIN_RIGHT_UP;
        motor_args->down_pin = OUT_PIN_RIGHT_DOWN;
    }

    uint8_t curr_pos = (motor_args->side_bit == LEFT_SIDE) ? positions.left_pos : positions.right_pos;

    if (move->target == MOVE_UP && curr_pos != POSITION_UP) {
        gpio_set_level(motor_args->up_pin, HIGH);
        gpio_set_level(motor_args->down_pin, LOW);
        return MOVE_UP;
    } else if (move->target == MOVE_DOWN && curr_pos != POSITION_DOWN) {
        gpio_set_level(motor_args->down_pin, HIGH);
        gpio_set_level(motor_args->up_pin, LOW);
        return MOVE_DOWN;
    } else if (move->target == MOVE_PARTIAL && move->target_pos > POSITION_DOWN && move->target_pos < POSITION_UP) {
        if (curr_pos == POSITION_DOWN) {
            gpio_set_level(motor_args->up_pin, HIGH);
            gpio_set_level(motor_args->down_pin, LOW);
            return MOVE_UP;
        } else if (curr_pos == POSITION_UP) {
            gpio_set_level(motor_args->down_pin, HIGH);
            gpio_set_level(motor_args->up_pin, LOW);
            return MOVE_DOWN;
        }
    }

    // if nothing above checks out, the
    // headlight is already in position, so it
    // should emit a nop
    return MOVE_NOP;
}

void set_side_off(output_args_t* args) {
    gpio_set_level(args->down_pin, LOW);
    gpio_set_level(args->up_pin, LOW);
}

void set_positions_on_complete(output_args_t* motor_args, move_type_t move_res) {
    if (motor_args->side_bit == LEFT_SIDE) {
        if (move_res == MOVE_UP)
            positions.left_pos = 100;
        else if (move_res == MOVE_DOWN)
            positions.left_pos = 0;

        positions.last_left_move_dir = move_res;
    } else if (motor_args->side_bit == RIGHT_SIDE) {
        if (move_res == MOVE_UP)
            positions.right_pos = 100;
        else if (move_res == MOVE_DOWN)
            positions.right_pos = 0;

        positions.last_right_move_dir = move_res;
    }
}

void handle_output_task(void* args) {
    output_args_t* motor = (output_args_t*)args;
    for (;;) {
        movement_target_t move;
        if (xQueueReceive(motor->queue, &move, portMAX_DELAY)) {
            // clear stopped bits
            xEventGroupClearBits(movement_event, motor->stopped_bit);

            uint8_t curr_pos = (motor->side_bit == LEFT_SIDE) ? positions.left_pos : positions.right_pos;
            uint8_t side_sleepy = (motor->side_bit == LEFT_SIDE) ? is_left_sleepy() : is_right_sleepy();

            move_type_t move_res = start_side_move(motor, &move);

            if (move_res != MOVE_NOP) {
                if (move.target == MOVE_PARTIAL) {
                    uint16_t move_time_ms = get_avg_move_time_ms();
                    uint16_t permille = get_partial_time_permille(move.target_pos, move_res);
                    uint32_t delay_ms = compute_partial_move_delay_ms(move_time_ms, move.target_pos, move_res);

                    BLE_LOGD(TAG, "%s PARTIAL %s: %u%% -> %u%% (%u.%u%% of %ums, %lums)", side_to_str(motor->side_bit), move_type_to_str(move_res), curr_pos, move.target_pos, permille / 10, permille % 10, move_time_ms, (unsigned long)delay_ms);

                    xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(delay_ms));

                    if (motor->side_bit == LEFT_SIDE) {
                        positions.left_pos = move.target_pos;
                        positions.last_left_move_dir = move_res;
                    } else if (motor->side_bit == RIGHT_SIDE) {
                        positions.right_pos = move.target_pos;
                        positions.last_right_move_dir = move_res;
                    }
                    set_side_off(motor);

                    uint8_t is_moving = (motor->side_bit == LEFT_SIDE) ? movement_stats.left_moving : movement_stats.right_moving;
                    if (is_moving)
                        xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(50));
                } else if (side_sleepy) {
                    move_type_t last_dir = (motor->side_bit == LEFT_SIDE) ? positions.last_left_move_dir : positions.last_right_move_dir;
                    uint16_t move_time_ms = get_avg_move_time_ms();
                    uint16_t used_permille = get_partial_time_permille(curr_pos, last_dir);
                    uint16_t rem_permille = (move_res == last_dir) ? ((used_permille < 1000) ? (1000 - used_permille) : 0) : used_permille;
                    uint32_t est_rem_ms = ((uint32_t)move_time_ms * rem_permille + 500) / 1000;
                    uint32_t cutoff_ms = est_rem_ms + SLEEPY_EXIT_MARGIN_MS;
                    if (cutoff_ms > MOVE_TIME_LIMIT_MS)
                        cutoff_ms = MOVE_TIME_LIMIT_MS;

                    BLE_LOGD(TAG, "%s SLEEPY_EXIT %s: from %u%% (est=%lums, cutoff=%lums)", side_to_str(motor->side_bit), move_type_to_str(move_res), curr_pos, (unsigned long)est_rem_ms, (unsigned long)cutoff_ms);

                    // Wait until the physical cam limit switch stops the motor (motor->stopped_bit),
                    // with a hard safety cutoff if the headlight was already resting on the limit switch.
                    EventBits_t completed_bits = xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(cutoff_ms));

                    // If the motor is still actively drawing current at cutoff_ms (e.g. cold/uncalibrated motor),
                    // extend the wait up to MOVE_TIME_LIMIT_MS so power is never cut before the limit switch opens.
                    uint8_t is_moving = (motor->side_bit == LEFT_SIDE) ? movement_stats.left_moving : movement_stats.right_moving;
                    if ((completed_bits & motor->stopped_bit) == 0 && is_moving && cutoff_ms < MOVE_TIME_LIMIT_MS) {
                        uint32_t extra_ms = MOVE_TIME_LIMIT_MS - cutoff_ms;
                        completed_bits = xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(extra_ms));
                    }

                    if ((completed_bits & motor->stopped_bit) == 0)
                        BLE_LOGW(TAG, "%s SLEEPY_EXIT %s hard cutoff reached (from %u%%)", side_to_str(motor->side_bit), move_type_to_str(move_res), curr_pos);

                    set_side_off(motor);

                    is_moving = (motor->side_bit == LEFT_SIDE) ? movement_stats.left_moving : movement_stats.right_moving;
                    if (is_moving)
                        xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(50));

                    set_positions_on_complete(motor, move_res);
                } else {
                    BLE_LOGD(TAG, "%s FULL %s from %u%%", side_to_str(motor->side_bit), move_type_to_str(move_res), curr_pos);

                    EventBits_t completed_bits = xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, MAX_WAIT_TIME_MS);
                    if ((completed_bits & motor->stopped_bit) == 0)
                        BLE_LOGE(TAG, "%s %s timed out (%ums)!", side_to_str(motor->side_bit), move_type_to_str(move_res), MOVE_TIME_LIMIT_MS);
                    // if ((completed_bits & motor->stopped_bit) == 0)
                    // {
                    //     // timeout event
                    //     // again, these could probably be more informative
                    //     // as there may be more things to notify
                    //     // the monitor tasks about
                    //     if (motor->side_bit == LEFT_SIDE)
                    //         xTaskNotifyGive(left_feedback_task);
                    //     else if (motor->side_bit == RIGHT_SIDE)
                    //         xTaskNotifyGive(right_feedback_task);
                    // }
                    set_side_off(motor);
                    set_positions_on_complete(motor, move_res);
                }

                uint8_t new_pos = (motor->side_bit == LEFT_SIDE) ? positions.left_pos : positions.right_pos;
                BLE_LOGV(TAG, "%s stopped -> pos=%u%%", side_to_str(motor->side_bit), new_pos);
                ble_notify_headlight_status();
            } else {
                BLE_LOGV(TAG, "%s %s -> NOP (at %u%%)", side_to_str(motor->side_bit), move_type_to_str(move.target), curr_pos);
                xEventGroupSetBits(movement_event, motor->stopped_bit);
                set_side_off(motor);
            }

            // TODO: error bits? we'll see
            // notify main command task
            if (move.final_move == 1)
                xTaskNotifyGive(command_output_task);

            xEventGroupSetBits(output_event_group, motor->move_complete_bit);

            // notify command task that movement finished
            // todo: probably eventually will want a more ... insightful type
            // of notification. for example, if the above wait times out?
            // xTaskNotifyGive(command_output_task);
        }
    }
}
headlight_position_t get_position() {
    return positions;
}

void set_all_positions_on_boot(uint8_t button_state) {
    if (button_state == HIGH) {
        positions.left_pos = POSITION_UP;
        positions.right_pos = POSITION_UP;
        positions.last_left_move_dir = MOVE_UP;
        positions.last_right_move_dir = MOVE_UP;
    } else {
        positions.left_pos = POSITION_DOWN;
        positions.right_pos = POSITION_DOWN;
        positions.last_left_move_dir = MOVE_DOWN;
        positions.last_right_move_dir = MOVE_DOWN;
    }
}

void swap_position_sides() {
    uint8_t tmp_pos = positions.left_pos;
    positions.left_pos = positions.right_pos;
    positions.right_pos = tmp_pos;

    move_type_t tmp_dir = positions.last_left_move_dir;
    positions.last_left_move_dir = positions.last_right_move_dir;
    positions.last_right_move_dir = tmp_dir;
}