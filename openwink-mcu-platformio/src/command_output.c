#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

QueueHandle_t command_output_queue;
TaskHandle_t command_output_task;

void init_command_queue()
{
    command_output_queue = xQueueCreate(20, sizeof(command_type));
}

// note: portMAX_DELAY might be a bad idea in general, but for now its ok while porting over
void handle_command_task()
{
    command_type received;
    for (;;)
    {
        if (xQueueReceive(command_output_queue, &received, portMAX_DELAY))
        {
            movement_target_t action = { 0 };

            // TODO: if a headlight is sleepy eye, the headlight must exit sleepy eye
            // execute the command, then re-enter sleepy eye


            switch (received.command)
            {
            case BOTH_UP:
                action.left_target = UP;
                action.right_target = UP;
                xQueueSend(output_queue, &action, portMAX_DELAY);
                // when notification returns, it movement should have finished
                // - it may be beneficial to use a more informative non-blocking wait
                // - knowing return type could be useful
                // - success, timeout, interruption, already in position, etc
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case BOTH_DOWN:
                break;
                action.left_target = DOWN;
                action.right_target = DOWN;
                xQueueSend(output_queue, &action, portMAX_DELAY);
                // these blocking forever i think is fine, since
                // the output task (once time is decided) will
                // never block forever, (max 1000ms or so?)
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
            case BOTH_BLINK:
                headlight_position_t curr_pos = get_position();
                // while in this main switch, position should always be 0 or 100
                action.left_target = curr_pos.left_pos == 100 ? DOWN : UP;
                action.right_target = curr_pos.right_pos == 100 ? DOWN : UP;
                xQueueSend(output_queue, &action, portMAX_DELAY);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                curr_pos = get_position();
                action.left_target = curr_pos.left_pos == 100 ? DOWN : UP;
                action.right_target = curr_pos.right_pos == 100 ? DOWN : UP;
                xQueueSend(output_queue, &action, portMAX_DELAY);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;

            default: break;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}