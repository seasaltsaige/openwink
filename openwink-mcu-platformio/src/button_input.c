#include "button_input.h"
#include "command_output.h"
#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

button_input_t input_state = {
    .button_state = 0,
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
    for (;;)
    {
        uint8_t level = gpio_get_level(BUTTON_INPUT);
        if (input_state.button_state != level)
        {
            // Send to command_output handler
            // TODO: Build out multipress system
            // TODO: Add headlight-on bypass debounce system
            command_types_t cmd = LEFT_WAVE;// level == 0 ? BOTH_DOWN : BOTH_UP;
            xQueueSend(command_output_queue, &cmd, 0);
            input_state.button_state = level;
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}