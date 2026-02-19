#include "config/tasks_conf.h"
#include "freertos/FreeRTOS.h"
#include "globals.h"
#include "handler/command.h"
#include "handler/input.h"


void INIT_tasks()
{
    xTaskCreate(button_task, "BUTTON_TASK", 2048, NULL, 1, NULL);
    xTaskCreate(update_headlight_state_task, "COMMAND_TASK", 2048, NULL, 2, NULL);
    xTaskCreate(poll_headlight_status_task, "POLL_TASK", 2048, NULL, 1, NULL);
}

void update_headlight_state_task(void*)
{
    for (;;)
    {
        // CommandHandler
        // Update every millisecond
        vTaskDelay(pdMS_TO_TICKS(1));
    }
}

void poll_headlight_status_task(void*)
{
    for (;;)
    {
        LEVEL l_state = static_cast<LEVEL>(gpio_get_level(Settings::HEADLIGHT_STATUS_LEFT));
        LEVEL r_state = static_cast<LEVEL>(gpio_get_level(Settings::HEADLIGHT_STATUS_RIGHT));
        // Poll left headlight
        MovementHandler::poll_left(l_state);
        MovementHandler::poll_right(r_state);

        // Poll every ms
        vTaskDelay(pdMS_TO_TICKS(1));
    }
}

void button_task(void*)
{
    uint8_t pressCounter = 0;
    int64_t lastPressTime = 0;

    for (;;)
    {

        ButtonEvent button_event;
        if (xQueueReceive(button_queue, &button_event, pdMS_TO_TICKS(Settings::multi_press_timeout)))
        {
            // Check debounce
            // IF debounce occurred, press counts should be reset, as actions should not happen if bypass is not enabled
            if ((button_event.event_time - lastPressTime) <= BUTTON_DEBOUNCE_US)
            {
                // Check if bypass enabled
                if (Settings::bypass_headlight_restriction)
                {
                    pressCounter++;
                    lastPressTime = button_event.event_time;
                }
                continue;
            }

            // Check if custom on
            if (!Settings::custom_press_enabled)
            {
                if (button_event.button_level == HIGH)
                {
                    CommandHandler::request_movement(HEADLIGHT_COMMAND::BOTH_UP);
                }
                else
                {
                    CommandHandler::request_movement(HEADLIGHT_COMMAND::BOTH_DOWN);
                }
            }

            // Increment press counter
            pressCounter++;
        }
        else
        {
            if (pressCounter > 0)
            {
                // Start movement command
                if (pressCounter < 10)
                    CommandHandler::request_movement(pressCounter);
                else if (pressCounter == 12)
                    // Swap left/right
                    (void)pressCounter;
                else if (pressCounter == 20)
                    // Reset settings + flash
                    (void)pressCounter;

                // Reset Press Counter
                pressCounter = 0;
            }
        }
    }
}
