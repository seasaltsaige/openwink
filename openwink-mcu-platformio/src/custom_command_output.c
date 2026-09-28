#include "custom_command_output.h"
#include "command_output.h"

TaskHandle_t custom_command_task_handle;
QueueHandle_t custom_command_queue_handle;

uint8_t command_executing = 0;

void init_custom_command_queue()
{
    custom_command_queue_handle = xQueueCreate(1, sizeof(custom_command_data_t));
}

uint8_t get_custom_command_executing()
{
    return command_executing;
}

void custom_command_task()
{
    custom_command_data_t cmd_data;
    for (;;)
    {
        if (xQueueReceive(custom_command_queue_handle, &cmd_data, portMAX_DELAY))
        {
            // loop through each value of the cmd
            // sequence_index will be equal to i until a delay is encountered (3 bytes vs 1 byte)
            uint8_t sequence_index = 0;
            command_executing = 1;
            for (uint8_t i = 0; i < cmd_data.sequence_length; i++)
            {
                uint32_t wait_result;
                xTaskNotifyWait(NOTIFY_BUTTON_INTERRUPT_BIT, 0x0, &wait_result, 0);
                if ((wait_result & NOTIFY_BUTTON_INTERRUPT_BIT) != 0)
                {
                    command_executing = 0;
                    break;
                }

                if (cmd_data.sequence[sequence_index] == DELAY_PREFIX)
                {
                    // Handle delay
                    uint16_t delay = (cmd_data.sequence[sequence_index + 1] << 0) | (cmd_data.sequence[sequence_index + 2] << 8);
                    xTaskNotifyWait(NOTIFY_BUTTON_INTERRUPT_BIT, 0x0, &wait_result, pdMS_TO_TICKS(delay));
                    if ((wait_result & NOTIFY_BUTTON_INTERRUPT_BIT) != 0)
                    {
                        command_executing = 0;
                        break;
                    }
                    else
                        sequence_index += 3;
                }
                else
                {
                    // Send regular cmd
                    command_t cmd = cmd_data.sequence[sequence_index];
                    xQueueSend(command_output_queue, &cmd, portMAX_DELAY);

                    // this also likely needs to not be portMAX_DELAY
                    // determine how long the longest command should take on the high end (left-right x2 at 1000ms timeout?)
                    // return value
                    // maybe this is fine though since all commands will timeout eventually
                    xTaskNotifyWait(NOTIFY_COMMAND_DONE_BIT | NOTIFY_BUTTON_INTERRUPT_BIT, 0x0, &wait_result, portMAX_DELAY);

                    if ((wait_result & NOTIFY_BUTTON_INTERRUPT_BIT) != 0)
                    {
                        // command interrupted
                        command_executing = 0;
                        break;
                    }
                    else if ((wait_result & NOTIFY_COMMAND_DONE_BIT) != 0)
                        sequence_index += 1;
                }
            }
        }
    }
}