#include "config/tasks_conf.h"
#include "globals.h"
#include "handler/headlight_input.h"
#include "handler/headlight_output.h"
#include "handler/oem_button.h"
#include "handler/queue.h"

#include "freertos/FreeRTOS.h"

void INIT_tasks()
{
    // Initialize handler class for button input
    OemButtonHandler::init();
    // Initialize handler class for headlight motion input
    HeadlightInputHandler::init();
    // Initialize handler class for headlight movement
    HeadlightOutputHandler::init();

    xTaskCreate(button_task, "BUTTON_TASK", 2048, NULL, 1, NULL);
    xTaskCreate(headlight_output_task, "HEADLIGHT_OUTPUT_TASK", 2048, NULL, 1, NULL);
    xTaskCreate(headlight_input_task, "HEADLIGHT_INPUT_TASK", 1024, NULL, 2, NULL);
}

void button_task(void*)
{
    uint8_t button_pressed_value;
    for (;;)
    {
        if (xQueueReceive(button_queue, &button_pressed_value, portMAX_DELAY))
        {
            auto current_input = static_cast<LEVEL>(button_pressed_value);
            printf("Button Press Received: %s\n", current_input == LEVEL::HIGH ? "High" : "Low");

            if (OemButtonHandler::getCustomButtonEnabled())
            {
                // TODO when custom commands are enabled
            }
            else
            {
                if (current_input != OemButtonHandler::getLastButtonStatus())
                {
                    HeadlightOutputHandler::send_command(current_input == LEVEL::HIGH ? HEADLIGHT_COMMAND::BOTH_UP : HEADLIGHT_COMMAND::BOTH_DOWN);

                    OemButtonHandler::setLastButtonStatus(current_input);
                }
            }
        }
    }
}
void headlight_input_task(void*)
{
    for (;;)
    {
        bool status;
        if (xQueueReceive(headlight_input_queue, &status, portMAX_DELAY))
        {
            printf("RECEIVED INPUT HEADLIGHT QUEUE");
        }
    }
}

// Used for BLE device
void headlight_output_task(void*)
{
    for (;;)
    {
        int receivedCommand;
        if (xQueueReceive(headlight_output_queue, &receivedCommand, portMAX_DELAY))
        {
            printf("RECEIVED OUTPUT QUEUE: %d\n", receivedCommand);
            HeadlightOutputHandler::send_command((HEADLIGHT_COMMAND)receivedCommand);
        }
    }
}
