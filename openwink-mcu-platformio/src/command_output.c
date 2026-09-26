#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

QueueHandle_t command_output_queue;
TaskHandle_t command_output_task;

void init_command_queue()
{
    command_output_queue = xQueueCreate(20, sizeof(command_types_t));
}

// note: portMAX_DELAY might be a bad idea in general, but for now its ok while porting over
void handle_command_task()
{
    command_types_t received;
    for (;;)
    {
        if (xQueueReceive(command_output_queue, &received, portMAX_DELAY))
        {
            movement_target_t l_action = { 0 };
            movement_target_t r_action = { 0 };
            headlight_position_t curr_pos;

            // TODO: if a headlight is sleepy eye, the headlight must exit sleepy eye
            // execute the command, then re-enter sleepy eye
            // ^^^^^
            // executing sleepy eye while in sleepy eye will reset it instead
            switch (received)
            {
            case BOTH_UP:
                l_action.target = UP;
                r_action.target = UP;
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                xQueueSend(left_output_queue, &l_action, portMAX_DELAY);
                xQueueSend(right_output_queue, &r_action, portMAX_DELAY);
                // when notification returns, it movement should have finished
                // - it may be beneficial to use a more informative non-blocking wait
                // - knowing return type could be useful
                // - success, timeout, interruption, already in position, etc
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;
            case BOTH_DOWN:
                l_action.target = DOWN;
                r_action.target = DOWN;

                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                xQueueSend(left_output_queue, &l_action, portMAX_DELAY);
                xQueueSend(right_output_queue, &r_action, portMAX_DELAY);
                // these blocking forever i think is fine, since
                // the output task (once time is decided) will
                // never block forever, (max 1000ms or so?)
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;
            case BOTH_BLINK:
                curr_pos = get_position();
                // // while in this main switch, position should always be 0 or 100
                l_action.target = curr_pos.left_pos == 100 ? DOWN : UP;
                r_action.target = curr_pos.right_pos == 100 ? DOWN : UP;

                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                xQueueSend(left_output_queue, &l_action, portMAX_DELAY);
                xQueueSend(right_output_queue, &r_action, portMAX_DELAY);

                l_action.target = curr_pos.left_pos == 100 ? UP : DOWN;
                r_action.target = curr_pos.right_pos == 100 ? UP : DOWN;

                xQueueSend(left_output_queue, &l_action, portMAX_DELAY);
                xQueueSend(right_output_queue, &r_action, portMAX_DELAY);

                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case LEFT_UP: break;
            case LEFT_DOWN: break;
            case LEFT_WINK: break;
            case RIGHT_UP: break;
            case RIGHT_DOWN: break;
            case RIGHT_WINK: break;
            case LEFT_WAVE:

                // perhaps for something like this, instead of a "completed"
                // notification, we need the output handler to notify once the last
                // action of the command finishes... hard with them split though
                // since this should probably block until the whole command sequence finishes
                curr_pos = get_position();
                l_action.target = curr_pos.left_pos == 100 ? DOWN : UP;
                xQueueSend(left_output_queue, &l_action, portMAX_DELAY);
                l_action.target = curr_pos.left_pos == 100 ? UP : DOWN;
                xQueueSend(left_output_queue, &l_action, portMAX_DELAY);

                vTaskDelay(pdTICKS_TO_MS(248));
                r_action.target = curr_pos.right_pos == 100 ? DOWN : UP;
                xQueueSend(right_output_queue, &r_action, portMAX_DELAY);
                r_action.target = curr_pos.right_pos == 100 ? UP : DOWN;
                xQueueSend(right_output_queue, &r_action, portMAX_DELAY);

                break;
            case RIGHT_WAVE: break;
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