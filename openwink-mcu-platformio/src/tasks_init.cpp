#include "tasks_init.h"
#include "../include/common.h"
#include "handler/headlight_input.h"
#include "handler/headlight_output.h"
#include "handler/oem_button.h"

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
        if (xQueueReceive(button_queue, &button_pressed, pdMS_TO_TICKS(5)))
        {
            if (button_pressed)
            {
                printf("RECEIVED BUTTON PRESS");
            }
        }

        vTaskDelay(pdMS_TO_TICKS(5));
    }
}
void headlight_input_task(void *)
{
}

void headlight_output_task(void *)
{
    for (;;)
    {
        int receivedCommand;
        if (xQueueReceive(headlight_output_queue, &receivedCommand, pdMS_TO_TICKS(5)))
        {
            printf("RECEIVED OUTPUT QUEUE");
        }
    }
}
