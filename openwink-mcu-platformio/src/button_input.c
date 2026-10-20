
#include <FreeRTOSConfig.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>

#include "ble/debugger/ble_debugger.h"
#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "output_handler.h"

static const char* TAG = "BTN";

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
            if (level != input_state.button_state) {
                command_t cmd = COMMAND_NONE;

                if (level == HIGH)
                    cmd = COMMAND_BOTH_UP;
                else
                    cmd = COMMAND_BOTH_DOWN;

                input_state.button_state = level;

                BLE_LOGI(TAG, "OEM button -> %s", command_to_str((command_types_t)cmd));
                xQueueSend(command_output_queue, &cmd, 0);
            }
        } else {

            if (input_state.button_state != level) {
                last_press_time_us = esp_timer_get_time();
                press_counter++;

                BLE_LOGV(TAG, "Button edge %s (count=%u)", level == HIGH ? "HIGH" : "LOW", press_counter);
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

                    BLE_LOGI(TAG, "Button 1x -> %s", command_to_str((command_types_t)cmd));
                    xQueueSend(command_output_queue, &cmd, 0);

                    press_counter = 0;
                    continue;
                }

                if (press_counter > 9) {
                    // swap orientation
                    if (press_counter == 12) {
                        BLE_LOGI(TAG, "Button 12x special sequence triggered");
                        // module reset
                    } else if (press_counter == 20) {
                        BLE_LOGI(TAG, "Button 20x special sequence triggered");
                    } else {
                        BLE_LOGW(TAG, "Button %ux clamped to 9x", press_counter);
                        press_counter = 9;
                    }
                }

                uint8_t bind_pos = (uint8_t)(press_counter - 2);
                button_binding_t binding;
                get_binding_at_pos(&binding, bind_pos);

                if (binding.type == BINDING_BUILTIN) {
                    BLE_LOGI(TAG, "Button %ux (pos %u) -> %s", press_counter, bind_pos, command_to_str((command_types_t)binding.data.builtin));
                    xQueueSend(command_output_queue, &binding.data.builtin, 0);
                } else if (binding.type == BINDING_CUSTOM_SEQUENCE) {
                    BLE_LOGI(TAG, "Button %ux (pos %u) -> CUSTOM_SEQUENCE (len=%u, loop=%u)", press_counter, bind_pos, binding.data.custom.sequence_length, binding.data.custom.looping);
                    request_command_submission(&binding.data.custom);
                } else {
                    BLE_LOGD(TAG, "Button %ux (pos %u) -> NONE (unbound)", press_counter, bind_pos);
                }


                press_counter = 0;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}