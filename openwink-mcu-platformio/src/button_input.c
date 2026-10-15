
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

button_config_t button_config = {
    .custom_actions_enabled = 1,
    .button_delay_ms = 500,

    .bindings = {
        [7] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_BOTH_BLINK,
        },
        [1] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_LEFT_WINK,
        },
        [2] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_RIGHT_WINK,
        },
        [3] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_LEFT_RIGHT,
        },
        [4] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_SLEEPY_EYE,
        },
        [5] = {
            .type = BINDING_CUSTOM_SEQUENCE,
            .looping = 0,
            .data.custom = {
                .sequence = {
                    COMMAND_LEFT_WINK,
                    0xDE, 0xF4, 0x01,
                    COMMAND_RIGHT_WINK,
                },
                .sequence_length = 3,
            },
        },
        [6] = {
            .type = BINDING_CUSTOM_SEQUENCE,
            .looping = 0,
            .data.custom = {
                .sequence = {
                    COMMAND_BOTH_UP,
                    0xDE, 0xF4, 0x01,
                    COMMAND_BOTH_DOWN,
                },
                .sequence_length = 3,
            },
        },
        [0] = {
            .type = BINDING_CUSTOM_SEQUENCE,
            .looping = 1,
            .data.custom = {
                .sequence = {
                    COMMAND_LEFT_WAVE,
                    0xDE, 0xF4, 0x01,
                    COMMAND_RIGHT_WAVE,
                    0xDE, 0xF4, 0x01,
                },
                .sequence_length = 4,
            },
        },
    },
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

void input_read_task() {
    int64_t last_press_time_us = 0;
    // literally just using a 16 bit value so you cant overflow
    // 255 would already be hard, but... just in case i guess
    uint16_t press_counter = 0;
    for (;;) {
        uint8_t level = gpio_get_level(BUTTON_INPUT);

        if (button_config.custom_actions_enabled == false) {
            if (level == input_state.button_state)
                return;

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
            } else if (press_counter > 0 && (esp_timer_get_time() - last_press_time_us) > ((uint64_t)button_config.button_delay_ms * 1000)) {
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

                button_binding_t binding = button_config.bindings[press_counter - 2];

                if (binding.type == BINDING_BUILTIN)
                    xQueueSend(command_output_queue, &binding.data.builtin, 0);
                else if (binding.type == BINDING_CUSTOM_SEQUENCE)
                    xQueueSend(custom_command_queue_handle, &binding.data.custom, 0);


                press_counter = 0;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}