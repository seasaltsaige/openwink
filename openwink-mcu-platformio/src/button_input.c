
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
    input_state.button_state = (uint8_t)gpio_get_level(BUTTON_INPUT);
}

void input_read_task(void* args) {
    int64_t last_press_time_us = 0;
    // literally just using a 16 bit value so you cant overflow
    // 255 would already be hard, but... just in case i guess
    uint16_t press_counter = 0;
    for (;;) {
        uint8_t level = gpio_get_level(BUTTON_INPUT);

        if (!get_custom_button_status()) {
            if (level == input_state.button_state)
                continue;

            command_t cmd = COMMAND_NONE;

            if (level == HIGH)
                cmd = COMMAND_BOTH_UP;
            else
                cmd = COMMAND_BOTH_DOWN;

            xQueueSend(command_output_queue, &cmd, 0);

        } else {

            if (input_state.button_state != level) {
                last_press_time_us = esp_timer_get_time();
                press_counter++;

                request_command_cancellation();

                // TODO: Add headlight-on bypass debounce system
                input_state.button_state = level;
            } else if (press_counter > 0 && (esp_timer_get_time() - last_press_time_us) > ((int64_t)get_custom_button_delay() * 1000)) {
                command_t cmd = COMMAND_NONE;

                if (press_counter == 1) {
                    if (input_state.button_state == HIGH)
                        cmd = COMMAND_BOTH_UP;
                    else if (input_state.button_state == LOW)
                        cmd = COMMAND_BOTH_DOWN;

                    xQueueSend(command_output_queue, &cmd, 0);

                    press_counter = 0;
                    continue;
                }

                button_binding_t binding = get_binding_at_pos(press_counter - 2);

                if (binding.type == BINDING_BUILTIN)
                    xQueueSend(command_output_queue, &binding.data.builtin, 0);
                else if (binding.type == BINDING_CUSTOM_SEQUENCE)
                    request_command_submission(&binding.data.custom);
                // xQueueSend(custom_command_queue_handle, &binding.data.custom, 0);


                press_counter = 0;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}