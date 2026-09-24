#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include "button_input.h"
#include "command_output.h"

button_input_data input_data = {
    .button_state = 0x0,
};


void inputs_init() {
    const gpio_config_t input_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pin_bit_mask = (1UL << BUTTON_INPUT),
    };
    gpio_config(&input_config);
}

void read_input_on_boot() {
    input_data.button_state = (uint8_t)gpio_get_level(BUTTON_INPUT);
}

void input_read_task() {
    for (;;) {
        uint8_t level = gpio_get_level(BUTTON_INPUT);
        if (input_data.button_state != level) {
            // Send to command_output handler
            xQueueSendToBack(command_output_queue, (void *)level, 0);

        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}