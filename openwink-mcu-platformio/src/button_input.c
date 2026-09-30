
#include <FreeRTOSConfig.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>

#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "output_handler.h"

RTC_DATA_ATTR button_input_t input_state = {
    .button_state = LOW,
};


void inputs_init()
{
    const gpio_config_t input_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pin_bit_mask = (1UL << BUTTON_INPUT),
    };
    gpio_config(&input_config);
}

void read_input_on_boot()
{
    input_state.button_state = (uint8_t)gpio_get_level(BUTTON_INPUT);
}

void input_read_task()
{
    int64_t last_press_time_us = 0;
    // literally just using a 16 bit value so you cant overflow
    // 255 would already be hard, but... just in case i guess
    uint16_t press_counter = 0;
    for (;;)
    {
        uint8_t level = gpio_get_level(BUTTON_INPUT);
        if (input_state.button_state != level)
        {
            last_press_time_us = esp_timer_get_time();
            press_counter++;
            // TODO: Build out multipress system
            // TODO: Add headlight-on bypass debounce system
            input_state.button_state = level;
        }
        else if (press_counter > 0 && (esp_timer_get_time() - last_press_time_us) > 500000)
        {
            command_types_t cmd = { 0 };

            if (press_counter == 1)
            {
                xTaskNotify(custom_command_task_handle, NOTIFY_BUTTON_INTERRUPT_BIT, eSetBits);
            }

            // // to be replaced by button_bindings parser
            // if (press_counter == 1)
            // {
            //     if (input_state.button_state == HIGH)
            //         cmd = BOTH_UP;
            //     else if (input_state.button_state == LOW)
            //         cmd = BOTH_DOWN;
            // }
            // else if (press_counter == 2)
            // {
            if (press_counter == 2)
            {
                custom_command_data_t test_cmd = {
                    .looping = 0,
                    .sequence = { LEFT_WINK, RIGHT_WINK, 0xDE, 0xEE, 0x02, LEFT_WAVE, RIGHT_WAVE },
                    .sequence_length = 5,
                };
                // press_counter = 0;
                xQueueSend(custom_command_queue_handle, &test_cmd, portMAX_DELAY);
            }
            // continue;
            // }
            // else if (press_counter == 3)
            //     cmd = LEFT_WAVE;
            // else if (press_counter == 4)
            //     cmd = RIGHT_WAVE;

            // else if (press_counter != 0)
            //     cmd = LEFT_WINK;

            // xQueueSend(command_output_queue, &cmd, 0);

            press_counter = 0;
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}