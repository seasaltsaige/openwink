
#include <FreeRTOSConfig.h>
#include <driver/rtc_io.h>
#include <esp_sleep.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>

#include "ble/debugger/ble_debugger.h"
#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "module_settings.h"
#include "output_handler.h"
#include "storage_handler.h"

static const char* TAG = "BTN";

RTC_DATA_ATTR button_input_t input_state = {
    .button_state = LOW,
    .headlight_bypass = 0,
};

void inputs_init() {
    if (esp_sleep_get_wakeup_cause() != ESP_SLEEP_WAKEUP_UNDEFINED)
        rtc_gpio_deinit(BUTTON_INPUT);

    const gpio_config_t input_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pin_bit_mask = (1UL << BUTTON_INPUT),
    };
    gpio_config(&input_config);

    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED)
        get_nvs_input_bypass_status(&input_state.headlight_bypass);
}

void set_input_headlight_bypass(uint8_t status) {
    // log if setting to same state
    if (input_state.headlight_bypass == status) {
        BLE_LOGW(TAG, "Headlight bypass already set to %s", input_state.headlight_bypass ? "TRUE" : "FALSE");
        return;
    } else {
        // Assuming verified input from BLE callback
        input_state.headlight_bypass = status;
        BLE_LOGI(TAG, "Headlight bypass set to %s", input_state.headlight_bypass ? "TRUE" : "FALSE");
        set_nvs_input_bypass_status(status);
    }
}

void read_input_on_boot() {
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED)
        input_state.button_state = (uint8_t)gpio_get_level(BUTTON_INPUT);
}

void input_read_task(void* args) {
    int64_t last_press_time_us = 0;
    // literally just using a 16 bit value so you cant overflow
    // 255 would already be hard, but... just in case i guess
    uint16_t press_counter = 0;
    for (;;) {
        uint8_t level = gpio_get_level(BUTTON_INPUT);
        uint8_t custom_enabled = get_custom_button_status();

        if (input_state.button_state != level) {
            last_press_time_us = esp_timer_get_time();
            press_counter++;
            input_state.button_state = level;

            BLE_LOGV(TAG, "Button edge %s (count=%u)", level == HIGH ? "HIGH" : "LOW", press_counter);
            request_command_cancellation();

            // TODO: Add headlight-on bypass debounce system

            if (!custom_enabled) {
                command_t cmd = (level == HIGH) ? COMMAND_BOTH_UP : COMMAND_BOTH_DOWN;
                BLE_LOGI(TAG, "OEM button -> %s", command_to_str((command_types_t)cmd));
                xQueueSend(command_output_queue, &cmd, 0);
            }
        } else if (press_counter > 0 && (esp_timer_get_time() - last_press_time_us) > ((int64_t)get_custom_button_delay() * 1000)) {
            if (press_counter == 12) {
                // swap orientation
                BLE_LOGI(TAG, "Button 12x special sequence triggered");
                xQueueReset(command_output_queue);
                xQueueReset(custom_command_queue_handle);
                press_counter = 0;
                continue;
            } else if (press_counter == 20) {
                // module reset
                BLE_LOGI(TAG, "Button 20x special sequence triggered");
                reset_module();
                press_counter = 0;
                continue;
            }

            if (!custom_enabled) {
                press_counter = 0;
                continue;
            }

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
                BLE_LOGW(TAG, "Button %ux clamped to 9x", press_counter);
                press_counter = 9;
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
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}
