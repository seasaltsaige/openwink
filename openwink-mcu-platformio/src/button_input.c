
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
#include "sleep_handler.h"
#include "storage_handler.h"

static const char* TAG = "BTN";

RTC_DATA_ATTR button_input_t input_state = {
    .button_state = LOW,
    .headlight_bypass = 0,
};

static volatile uint8_t button_input_busy = 0;

uint8_t get_button_state() {
    return input_state.button_state;
}

uint8_t is_button_input_busy() {
    return button_input_busy;
}

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
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED) {
        input_state.button_state = (uint8_t)gpio_get_level(BUTTON_INPUT);
        set_all_positions_on_boot(input_state.button_state);
    }
}

void input_read_task(void* args) {
    int64_t last_press_time_us = 0;
    // literally just using a 16 bit value so you cant overflow
    // 255 would already be hard, but... just in case i guess
    uint16_t press_counter = 0;
    uint8_t check_debounce = 0;
    uint8_t debounce_occurred = 0;

    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_EXT0) {
        notify_sleep_button_activity();
        uint8_t level = (uint8_t)gpio_get_level(BUTTON_INPUT);
        uint8_t custom_enabled = get_custom_button_status();
        int64_t now_us = esp_timer_get_time();

        if (level != input_state.button_state) {
            input_state.button_state = level;
            request_command_cancellation();

            if (now_us > (DEBOUNCE_TIME_MS * 1000)) {
                press_counter = 1;
                check_debounce = 0;
                debounce_occurred = 0;
                last_press_time_us = now_us;
                BLE_LOGV(TAG, "Wakeup button press confirmed %s (count=%u)", level == HIGH ? "HIGH" : "LOW", press_counter);
                if (!custom_enabled) {
                    command_t cmd = (level == HIGH) ? COMMAND_BOTH_UP : COMMAND_BOTH_DOWN;
                    BLE_LOGI(TAG, "OEM button -> %s", command_to_str((command_types_t)cmd));
                    xQueueSend(command_output_queue, &cmd, 0);
                }
            } else {
                check_debounce = 1;
                debounce_occurred = 0;
                last_press_time_us = 0;
                BLE_LOGV(TAG, "Wakeup button edge %s (debounce continuing)", level == HIGH ? "HIGH" : "LOW");
            }
        } else {
            request_command_cancellation();
            last_press_time_us = now_us;
            check_debounce = 0;

            if (now_us <= (DEBOUNCE_TIME_MS * 1000)) {
                press_counter = 1;
                debounce_occurred = 1;
                BLE_LOGV(TAG, "Wakeup headlight-on pulse detected (count=%u, bypass=%u)", press_counter, input_state.headlight_bypass);
            } else {
                press_counter = 2;
                debounce_occurred = 0;
                BLE_LOGV(TAG, "Wakeup double-edge press confirmed %s (count=%u)", level == HIGH ? "HIGH" : "LOW", press_counter);
                if (!custom_enabled) {
                    command_t cmd = (level == HIGH) ? COMMAND_BOTH_UP : COMMAND_BOTH_DOWN;
                    BLE_LOGI(TAG, "OEM button -> %s", command_to_str((command_types_t)cmd));
                    xQueueSend(command_output_queue, &cmd, 0);
                }
            }
        }
        button_input_busy = (check_debounce || press_counter > 0) ? 1 : 0;
    }

    for (;;) {
        uint8_t level = gpio_get_level(BUTTON_INPUT);
        uint8_t custom_enabled = get_custom_button_status();
        int64_t now_us = esp_timer_get_time();

        // Small pulse occurred
        if (check_debounce && (input_state.button_state != level) && (now_us - last_press_time_us) <= (DEBOUNCE_TIME_MS * 1000)) {
            input_state.button_state = level;
            check_debounce = 0;
            debounce_occurred = 1;
            press_counter++;
            last_press_time_us = now_us;
            notify_sleep_button_activity();

            BLE_LOGV(TAG, "Headlight-on pulse detected (count=%u, bypass=%u)", press_counter, input_state.headlight_bypass);
            request_command_cancellation();
        } else if (input_state.button_state != level) {
            if (check_debounce) {
                press_counter++;
                if (!custom_enabled) {
                    command_t cmd = (input_state.button_state == HIGH) ? COMMAND_BOTH_UP : COMMAND_BOTH_DOWN;
                    BLE_LOGI(TAG, "OEM button -> %s", command_to_str((command_types_t)cmd));
                    xQueueSend(command_output_queue, &cmd, 0);
                }
            }
            last_press_time_us = now_us;
            input_state.button_state = level;
            check_debounce = 1;
            debounce_occurred = 0;
            notify_sleep_button_activity();

            BLE_LOGV(TAG, "Button edge %s (debounce start)", level == HIGH ? "HIGH" : "LOW");
            request_command_cancellation();
        } else if (check_debounce && (now_us - last_press_time_us) > (DEBOUNCE_TIME_MS * 1000)) {
            check_debounce = 0;
            debounce_occurred = 0;
            press_counter++;
            notify_sleep_button_activity();

            BLE_LOGV(TAG, "Button press confirmed %s (count=%u)", input_state.button_state == HIGH ? "HIGH" : "LOW", press_counter);
            request_command_cancellation();

            if (!custom_enabled) {
                command_t cmd = (input_state.button_state == HIGH) ? COMMAND_BOTH_UP : COMMAND_BOTH_DOWN;
                BLE_LOGI(TAG, "OEM button -> %s", command_to_str((command_types_t)cmd));
                xQueueSend(command_output_queue, &cmd, 0);
            }
        } else if (!check_debounce && press_counter > 0 && (now_us - last_press_time_us) > ((int64_t)get_custom_button_delay() * 1000)) {
            if (press_counter == 12) {
                // swap orientation
                BLE_LOGI(TAG, "Button 12x special sequence triggered");
                request_command_cancellation();
                xQueueReset(command_output_queue);
                xQueueReset(custom_command_queue_handle);
                uint8_t next_orientation = (get_module_orientation() == ORIENTATION_DEFAULT) ? ORIENTATION_SWAPPED : ORIENTATION_DEFAULT;
                set_module_orientation(next_orientation);
                command_t cmd = COMMAND_LEFT_WINK;
                xQueueSend(command_output_queue, &cmd, 0);
                press_counter = 0;
                debounce_occurred = 0;
                button_input_busy = 0;
                continue;
            } else if (press_counter == 20) {
                // module reset
                BLE_LOGI(TAG, "Button 20x special sequence triggered");
                const uint8_t notify_payload[1] = { SETTING_FLAG_RESET };
                ble_notify_general_settings(notify_payload, sizeof(notify_payload));
                reset_module();
                press_counter = 0;
                debounce_occurred = 0;
                button_input_busy = 0;
                continue;
            }

            if (!custom_enabled || (debounce_occurred && input_state.headlight_bypass == BYPASS_DISABLED)) {
                if (debounce_occurred && input_state.headlight_bypass == BYPASS_DISABLED)
                    BLE_LOGD(TAG, "Headlight-on sequence (%ux) ignored (bypass disabled)", press_counter);
                press_counter = 0;
                debounce_occurred = 0;
                button_input_busy = 0;
                continue;
            }

            int8_t resolved_pos = -1;
            button_binding_t binding = { .type = BINDING_NONE };

            // walk it back
            if (press_counter >= 2) {
                uint8_t max_pos = (press_counter > 9) ? (NUM_BINDINGS - 1) : (uint8_t)(press_counter - 2);
                for (int8_t pos = (int8_t)max_pos; pos >= 0; pos--) {
                    get_binding_at_pos(&binding, (uint8_t)pos);
                    if (binding.type != BINDING_NONE) {
                        resolved_pos = pos;
                        break;
                    }
                }
            }

            if (press_counter == 1 || resolved_pos < 0) {
                command_t cmd = COMMAND_NONE;
                if (debounce_occurred || input_state.button_state == HIGH)
                    cmd = COMMAND_BOTH_UP;
                else if (input_state.button_state == LOW)
                    cmd = COMMAND_BOTH_DOWN;

                BLE_LOGI(TAG, "Button %ux -> %s", press_counter, command_to_str((command_types_t)cmd));
                xQueueSend(command_output_queue, &cmd, 0);

                press_counter = 0;
                debounce_occurred = 0;
                button_input_busy = 0;
                continue;
            }

            uint8_t bind_pos = (uint8_t)resolved_pos;

            if (binding.type == BINDING_BUILTIN) {
                BLE_LOGI(TAG, "Button %ux (pos %u) -> %s", press_counter, bind_pos, command_to_str((command_types_t)binding.data.builtin));
                xQueueSend(command_output_queue, &binding.data.builtin, 0);
            } else if (binding.type == BINDING_CUSTOM_SEQUENCE) {
                BLE_LOGI(TAG, "Button %ux (pos %u) -> CUSTOM_SEQUENCE (len=%u, loop=%u)", press_counter, bind_pos, binding.data.custom.sequence_length, binding.data.custom.looping);
                request_command_submission(&binding.data.custom);
            }

            press_counter = 0;
            debounce_occurred = 0;
        }
        button_input_busy = (check_debounce || press_counter > 0) ? 1 : 0;
        vTaskDelay(pdMS_TO_TICKS(check_debounce ? 1 : 5));
    }
}
