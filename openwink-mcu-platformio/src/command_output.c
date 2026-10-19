#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <stdbool.h>

#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"
QueueHandle_t command_output_queue;
TaskHandle_t command_output_task;

void init_command_queue() {
    command_output_queue = xQueueCreate(20, sizeof(command_types_t));
}

// TODO: Add helper function similar to custom command to request submisison?
// maybe to abstract away the queue... not sure


static void queue_side_move(uint8_t side, move_type_t type, uint8_t is_final) {
    movement_target_t move = {
        .target = type,
        .target_pos = 0,
        .final_move = is_final,
    };
    if (side == LEFT_SIDE)
        xQueueSend(left_output_queue, &move, portMAX_DELAY);
    else if (side == RIGHT_SIDE)
        xQueueSend(right_output_queue, &move, portMAX_DELAY);
}

static void queue_side_partial_move(uint8_t side, uint8_t target_pos, uint8_t is_final) {
    movement_target_t move = {
        .target = MOVE_PARTIAL,
        .target_pos = target_pos,
        .final_move = is_final,
    };
    if (side == LEFT_SIDE)
        xQueueSend(left_output_queue, &move, portMAX_DELAY);
    else if (side == RIGHT_SIDE)
        xQueueSend(right_output_queue, &move, portMAX_DELAY);
}

static void queue_side_wink(uint8_t side, uint8_t is_final) {
    headlight_position_t pos = get_position();
    uint8_t curr_pos = (side == LEFT_SIDE) ? pos.left_pos : pos.right_pos;
    move_type_t last_dir = (side == LEFT_SIDE) ? pos.last_left_move_dir : pos.last_right_move_dir;
    uint8_t sleepy = (side == LEFT_SIDE) ? is_left_sleepy() : is_right_sleepy();

    if (!sleepy) {
        queue_side_move(side, curr_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
        queue_side_move(side, curr_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, is_final);
    } else {
        move_type_t cont_dir = (last_dir == MOVE_UP) ? MOVE_UP : MOVE_DOWN;
        move_type_t opp_dir = (cont_dir == MOVE_UP) ? MOVE_DOWN : MOVE_UP;
        queue_side_move(side, cont_dir, false);
        queue_side_move(side, opp_dir, false);
        queue_side_partial_move(side, curr_pos, is_final);
    }
}

static void exit_sleepy_to_origin() {
    headlight_position_t pos = get_position();
    uint8_t left_sleepy = is_left_sleepy();
    uint8_t right_sleepy = is_right_sleepy();

    if (!left_sleepy && !right_sleepy)
        return;

    move_type_t left_finish = left_sleepy ? (pos.last_left_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;
    move_type_t right_finish = right_sleepy ? (pos.last_right_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;

    move_type_t left_reverse = left_sleepy ? (left_finish == MOVE_UP ? MOVE_DOWN : MOVE_UP) : MOVE_NOP;
    move_type_t right_reverse = right_sleepy ? (right_finish == MOVE_UP ? MOVE_DOWN : MOVE_UP) : MOVE_NOP;

    // finish current movement (up/down)
    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    queue_side_move(LEFT_SIDE, left_finish, false);
    queue_side_move(RIGHT_SIDE, right_finish, false);
    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

    // move completely in the opposite direction back to original position
    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    queue_side_move(LEFT_SIDE, left_reverse, false);
    queue_side_move(RIGHT_SIDE, right_reverse, false);
    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
}

static void sync_sides_before_sequence(uint8_t primary_side, headlight_position_t* saved_pos, uint8_t* was_sleepy) {
    *saved_pos = get_position();
    uint8_t left_sleepy = is_left_sleepy();
    uint8_t right_sleepy = is_right_sleepy();
    *was_sleepy = (left_sleepy || right_sleepy);

    if (*was_sleepy)
        exit_sleepy_to_origin();

    headlight_position_t curr = get_position();
    if (curr.left_pos != curr.right_pos) {
        uint8_t primary_pos = (primary_side == LEFT_SIDE) ? curr.left_pos : curr.right_pos;
        move_type_t sync_dir = (primary_pos == POSITION_UP) ? MOVE_UP : MOVE_DOWN;

        xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
        queue_side_move(LEFT_SIDE, sync_dir, false);
        queue_side_move(RIGHT_SIDE, sync_dir, false);
        xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
    }
}

static void restore_sleepy_after_sequence(const headlight_position_t* saved_pos, uint8_t was_sleepy) {
    if (!was_sleepy)
        return;

    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    if (saved_pos->left_pos != POSITION_DOWN && saved_pos->left_pos != POSITION_UP)
        queue_side_partial_move(LEFT_SIDE, saved_pos->left_pos, false);
    else
        queue_side_move(LEFT_SIDE, MOVE_NOP, false);

    if (saved_pos->right_pos != POSITION_DOWN && saved_pos->right_pos != POSITION_UP)
        queue_side_partial_move(RIGHT_SIDE, saved_pos->right_pos, false);
    else
        queue_side_move(RIGHT_SIDE, MOVE_NOP, false);

    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
}

// note: portMAX_DELAY might be a bad idea in general, but for now its ok while porting over
void handle_command_task(void* args) {

    command_types_t received;

    for (;;) {
        if (xQueueReceive(command_output_queue, &received, portMAX_DELAY)) {
            headlight_position_t curr_pos;
            headlight_position_t saved_pos;
            uint8_t was_sleepy = 0;
            command_types_t peek;
            BaseType_t peeked;

            switch (received) {
            // Both together
            case COMMAND_BOTH_UP:
                curr_pos = get_position();
                if ((is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_DOWN) || (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_DOWN)) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_DOWN) ? MOVE_DOWN : MOVE_NOP, false);
                    queue_side_move(RIGHT_SIDE, (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_DOWN) ? MOVE_DOWN : MOVE_NOP, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }

                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

                break;
            case COMMAND_BOTH_DOWN:
                curr_pos = get_position();
                if ((is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_UP) || (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_UP)) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_UP) ? MOVE_UP : MOVE_NOP, false);
                    queue_side_move(RIGHT_SIDE, (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_UP) ? MOVE_UP : MOVE_NOP, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }

                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_BOTH_BLINK:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                queue_side_wink(LEFT_SIDE, true);
                queue_side_wink(RIGHT_SIDE, true);

                // wait for both sides to finish their final movement
                ulTaskNotifyTake(pdFALSE, portMAX_DELAY);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;

            // Left Only
            case COMMAND_LEFT_UP:
                curr_pos = get_position();
                if (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_DOWN) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_LEFT_DOWN:
                curr_pos = get_position();
                if (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_UP) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, MOVE_UP, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_LEFT_WINK:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_wink(LEFT_SIDE, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;

            // Right Only
            case COMMAND_RIGHT_UP:
                curr_pos = get_position();
                if (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_DOWN) {
                    xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                    queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                    xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_RIGHT_DOWN:
                curr_pos = get_position();
                if (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_UP) {
                    xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                    queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                    xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_RIGHT_WINK:
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_wink(RIGHT_SIDE, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case COMMAND_LEFT_WAVE:
                sync_sides_before_sequence(LEFT_SIDE, &saved_pos, &was_sleepy);
                curr_pos = get_position();

                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, false);
                // Temp testing time to test wave
                vTaskDelay(pdMS_TO_TICKS((uint32_t)((float)1000 * (float)0.33)));
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);

                // Basically... this is kinda weird
                // but if the next command thats queued is another LEFT WAVE
                // it WOULD be nice to have it continue smooth movement instead
                // of waiting for both sides to stop.
                peeked = xQueuePeek(command_output_queue, &peek, 0);

                // switch to xTaskNotifyWait ? could get more info
                if (was_sleepy || peeked == pdFALSE || peek != COMMAND_LEFT_WAVE) {
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                    restore_sleepy_after_sequence(&saved_pos, was_sleepy);
                }

                break;
            case COMMAND_RIGHT_WAVE:
                sync_sides_before_sequence(RIGHT_SIDE, &saved_pos, &was_sleepy);
                curr_pos = get_position();

                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, false);
                // Temp testing time to test wave
                vTaskDelay(pdMS_TO_TICKS((uint32_t)((float)1000 * (float)0.33)));
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);

                peeked = xQueuePeek(command_output_queue, &peek, 0);

                if (was_sleepy || peeked == pdFALSE || peek != COMMAND_RIGHT_WAVE) {
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                    restore_sleepy_after_sequence(&saved_pos, was_sleepy);
                }

                break;
            case COMMAND_LEFT_RIGHT:
                sync_sides_before_sequence(LEFT_SIDE, &saved_pos, &was_sleepy);
                curr_pos = get_position();

                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                restore_sleepy_after_sequence(&saved_pos, was_sleepy);
                break;
            case COMMAND_LEFT_RIGHT_X2:
                sync_sides_before_sequence(LEFT_SIDE, &saved_pos, &was_sleepy);
                curr_pos = get_position();

                for (uint8_t i = 0; i < 2; i++) {
                    queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                    queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                    queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                    queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                }

                restore_sleepy_after_sequence(&saved_pos, was_sleepy);
                break;
            case COMMAND_RIGHT_LEFT:
                sync_sides_before_sequence(RIGHT_SIDE, &saved_pos, &was_sleepy);
                curr_pos = get_position();

                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                restore_sleepy_after_sequence(&saved_pos, was_sleepy);
                break;
            case COMMAND_RIGHT_LEFT_X2:
                sync_sides_before_sequence(RIGHT_SIDE, &saved_pos, &was_sleepy);
                curr_pos = get_position();

                for (uint8_t i = 0; i < 2; i++) {
                    queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                    queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                    queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                    queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                }

                restore_sleepy_after_sequence(&saved_pos, was_sleepy);
                break;
            case COMMAND_SLEEPY_EYE:
                if (is_left_sleepy() || is_right_sleepy()) {
                    exit_sleepy_to_origin();
                } else {
                    uint8_t left_val = 50;
                    uint8_t right_val = 50;
                    get_sleepy_eye_values(&left_val, &right_val);

                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                    queue_side_partial_move(LEFT_SIDE, left_val, false);
                    queue_side_partial_move(RIGHT_SIDE, right_val, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                break;

            default: break;
            }

            if (get_custom_command_executing())
                xTaskNotify(custom_command_task_handle, NOTIFY_COMMAND_DONE_BIT, eSetBits);
        }
    }
}