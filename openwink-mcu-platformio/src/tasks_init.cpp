#include "tasks_init.h"
#include "../include/common.h"
#include "handler/headlight_input.h"
#include "handler/headlight_output.h"
#include "handler/oem_button.h"
#include "handler/queue_handler.h"

#include "freertos/FreeRTOS.h"

// TaskHandle_t buttonTask;
// TaskHandle_t headlightTask;

void INIT_tasks()
{
    // Initialize handler class for button input
    OemButtonHandler::init();
    // Initialize handler class for headlight motion input
    HeadlightInputHandler::init();
    // Initialize handler class for headlight movement
    HeadlightOutputHandler::init();

    xTaskCreate(button_task, "BUTTON_TASK", 2048, NULL, 1, NULL);
    xTaskCreate(headlight_output_task, "HEADLIGHT_OUTPUT_TASK", 1024, NULL, 1, NULL);
    xTaskCreate(headlight_input_task, "HEADLIGHT_INPUT_TASK", 1024, NULL, 2, NULL);
}

void button_task(void *)
{
    for (;;)
    {
        bool button_pressed;
        if (xQueueReceive(QueueHandler::button_queue, &button_pressed, portMAX_DELAY))
        {
            if (button_pressed)
            {
                auto current_input = static_cast<LEVEL>(gpio_get_level(BUTTON_INPUT));

                if (OemButtonHandler::getCustomButtonEnabled())
                {
                    // TODO when custom commands are enabled
                }
                else
                {
                    if (current_input != OemButtonHandler::getLastButtonStatus())
                    {
                        HeadlightOutputHandler::send_command(
                            current_input == LEVEL::HIGH ? HEADLIGHT_COMMAND::BOTH_UP : HEADLIGHT_COMMAND::BOTH_DOWN);

                        OemButtonHandler::setLastButtonStatus(current_input);
                    }
                }
            }
        }
    }
}
void headlight_input_task(void *)
{
    for (;;)
    {
        bool status;
        if (xQueueReceive(QueueHandler::headlight_input_queue, &status, portMAX_DELAY))
        {
            printf("RECEIVED INPUT HEADLIGHT QUEUE");
        }
    }
}

// Used for BLE device
void headlight_output_task(void *)
{
    for (;;)
    {
        int receivedCommand;
        if (xQueueReceive(QueueHandler::headlight_output_queue, &receivedCommand, portMAX_DELAY))
        {
            printf("RECEIVED OUTPUT QUEUE");
        }
    }
}
