#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

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
    if (motor_args->side_bit == LEFT_SIDE) {
        if (move->target == MOVE_UP && positions.left_pos != 100) {
            gpio_set_level(motor_args->up_pin, HIGH);
            gpio_set_level(motor_args->down_pin, LOW);
            return MOVE_UP;
        } else if (move->target == MOVE_DOWN && positions.left_pos != 0) {
            gpio_set_level(motor_args->down_pin, HIGH);
            gpio_set_level(motor_args->up_pin, LOW);
            return MOVE_DOWN;
        }
    } else if (motor_args->side_bit == RIGHT_SIDE) {
        if (move->target == MOVE_UP && positions.right_pos != 100) {
            gpio_set_level(motor_args->up_pin, HIGH);
            gpio_set_level(motor_args->down_pin, LOW);
            return MOVE_UP;
        } else if (move->target == MOVE_DOWN && positions.right_pos != 0) {
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
            // TODO: Handle sleepy eye
            // NOTE: If only a single sides status is SLEEPY_EYE
            // it is guarenteed (not LITERALLY, but by the APP)
            // that the other headlight will be a NOP and not a UP/DOWN

            // starts movement by assigning pins high/low
            // assumes UP/DOWN at this point
            // clear stopped bits
            xEventGroupClearBits(movement_event, motor->stopped_bit);

            move_type_t move_res = start_side_move(motor, &move);

            // TODO: Handle sleepy eye stuffs...
            if (move_res != MOVE_NOP) {
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
                set_positions_on_complete(motor, move_res);
            } else
                xEventGroupSetBits(movement_event, motor->stopped_bit);

            // clear outputs
            set_side_off(motor);

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