#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <stdbool.h>

#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

QueueHandle_t command_output_queue;
TaskHandle_t command_output_task;

void init_command_queue()
{
    command_output_queue = xQueueCreate(20, sizeof(command_types_t));
}


static void queue_side_move(uint8_t side, move_type_t type, uint8_t is_final)
{
    movement_target_t move = {
        .target = type,
        .final_move = is_final,
    };
    if (side == LEFT_SIDE)
        xQueueSend(left_output_queue, &move, portMAX_DELAY);
    else if (side == RIGHT_SIDE)
        xQueueSend(right_output_queue, &move, portMAX_DELAY);
}

// note: portMAX_DELAY might be a bad idea in general, but for now its ok while porting over
void handle_command_task()
{

    movement_target_t up_action = {
        .target = MOVE_UP,
        .final_move = 0,
    };
    movement_target_t down_action = {
        .target = MOVE_DOWN,
        .final_move = 0,
    };
    movement_target_t final = {
        .final_move = 1,
        .target = MOVE_NOP,
    };

    command_types_t received;

    for (;;)
    {
        if (xQueueReceive(command_output_queue, &received, portMAX_DELAY))
        {
            headlight_position_t curr_pos;
            command_types_t peek;
            BaseType_t peeked;
            // TODO: if a headlight is sleepy eye, the headlight must exit sleepy eye
            // execute the command, then re-enter sleepy eye
            // ^^^^^
            // executing sleepy eye while in sleepy eye will reset it instead
            switch (received)
            {
            // Both together
            case BOTH_UP:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                queue_side_move(LEFT_SIDE, MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                // xQueueSend(left_output_queue, &up_action, portMAX_DELAY);
                // xQueueSend(right_output_queue, &up_action, portMAX_DELAY);
                // when notification returns, it movement should have finished
                // - it may be beneficial to use a more informative non-blocking wait
                // - knowing return type could be useful
                // - success, timeout, interruption, already in position, etc
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

                break;
            case BOTH_DOWN:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case BOTH_BLINK:
                curr_pos = get_position();
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);

                // wait for final movement alert
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;

            // Left Only
            case LEFT_UP:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case LEFT_DOWN:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case LEFT_WINK:
                curr_pos = get_position();
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;

            // Right Only
            case RIGHT_UP:
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case RIGHT_DOWN:
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case RIGHT_WINK:
                curr_pos = get_position();
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case LEFT_WAVE:
                // TODO: sync positions before starting
                // both headlights should start in whatever state
                // the starting headlight is in
                // if unknown, or sleepy, or something like that
                // they should move in the direction last moved


                // perhaps for something like this, instead of a "completed"
                // notification, we need the output handler to notify once the last
                // action of the command finishes... hard with them split though
                // since this should probably block until the whole command sequence finishes
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
                if (peeked == pdFALSE || peek != LEFT_WAVE)
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                break;
            case RIGHT_WAVE:
                curr_pos = get_position();
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, false);
                // Temp testing time to test wave
                vTaskDelay(pdMS_TO_TICKS((uint32_t)((float)1000 * (float)0.33)));
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);

                peeked = xQueuePeek(command_output_queue, &peek, 0);

                if (peeked == pdFALSE || peek != LEFT_WAVE)
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case LEFT_RIGHT: break;
            case LEFT_RIGHT_X2: break;
            case RIGHT_LEFT: break;
            case RIGHT_LEFT_X2: break;
            case SLEEPY_EYE: break;

            default: break;
            }
        }
    }
}