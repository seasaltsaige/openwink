#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <esp_sleep.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"
#include "storage_handler.h"

QueueHandle_t left_output_queue;
QueueHandle_t right_output_queue;
EventGroupHandle_t output_event_group;

RTC_DATA_ATTR headlight_position_t positions = {
    .left_pos = 0,
    .right_pos = 0,
    // actually i dont know if this is really necessary
    // for it to be at 0, the headlights must have moved
    // down to get there... lol
    .last_left_move_dir = MOVE_DOWN,
    .last_right_move_dir = MOVE_DOWN,
};

RTC_DATA_ATTR static uint8_t left_sleepy_target = 50;
RTC_DATA_ATTR static uint8_t right_sleepy_target = 50;

uint8_t is_left_sleepy() {
    return (positions.left_pos != POSITION_DOWN && positions.left_pos != POSITION_UP);
}

uint8_t is_right_sleepy() {
    return (positions.right_pos != POSITION_DOWN && positions.right_pos != POSITION_UP);
}

void set_sleepy_eye_values(uint8_t left, uint8_t right) {
    if (left == 0 || left >= 100 || right == 0 || right >= 100)
        return;

    left_sleepy_target = left;
    right_sleepy_target = right;
    set_nvs_left_sleepy_eye(left);
    set_nvs_right_sleepy_eye(right);
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
                    uint8_t travel_pct = (move_res == MOVE_UP) ? move.target_pos : (100 - move.target_pos);
                    uint16_t move_time_ms = (motor->side_bit == LEFT_SIDE) ? get_left_move_time_ms() : get_right_move_time_ms();
                    uint32_t delay_ms = ((uint32_t)move_time_ms * travel_pct) / 100;

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
                    uint8_t travel_pct = (move_res == MOVE_UP) ? (100 - curr_pos) : curr_pos;
                    uint16_t move_time_ms = (motor->side_bit == LEFT_SIDE) ? get_left_move_time_ms() : get_right_move_time_ms();
                    uint32_t delay_ms = ((uint32_t)move_time_ms * travel_pct) / 100;

                    xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(delay_ms));

                    set_side_off(motor);

                    uint8_t is_moving = (motor->side_bit == LEFT_SIDE) ? movement_stats.left_moving : movement_stats.right_moving;
                    if (is_moving)
                        xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, pdMS_TO_TICKS(50));

                    set_positions_on_complete(motor, move_res);
                } else {
                    EventBits_t completed_bits = xEventGroupWaitBits(movement_event, motor->stopped_bit, pdFALSE, pdTRUE, MAX_WAIT_TIME_MS);
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
            } else {
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