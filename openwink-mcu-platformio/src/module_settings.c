#include <FreeRTOSConfig.h>
#include <esp_sleep.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>

#include "aux_input.h"
#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "ble/pairing_auth.h"
#include "button_bindings.h"
#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "module_settings.h"
#include "output_handler.h"
#include "sleep_handler.h"
#include "storage_handler.h"

static const char* TAG = "SET";

RTC_DATA_ATTR static uint8_t module_orientation = ORIENTATION_DEFAULT;

void init_module_settings() {
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED)
        get_nvs_orientation(&module_orientation);
}

uint8_t handle_general_setting(const uint8_t* data, size_t size) {
    if (data == NULL || size == 0)
        return 0;

    uint8_t flag = data[0];

    switch (flag) {
    case SETTING_FLAG_CUSTOM_BUTTON_STATUS:
        if (size != 2 || data[1] > BINDING_ENABLED) {
            BLE_LOGE(TAG, "Invalid custom button status packet (size=%u)", (unsigned int)size);
            return 0;
        }
        set_custom_button_status(data[1]);
        return 1;

    case SETTING_FLAG_CUSTOM_BUTTON_DELAY: {
        if (size != 3) {
            BLE_LOGE(TAG, "Invalid custom button delay packet (size=%u)", (unsigned int)size);
            return 0;
        }
        uint16_t delay = (uint16_t)data[1] | ((uint16_t)data[2] << 8);
        if (delay < BINDING_DELAY_MIN || delay > BINDING_DELAY_MAX) {
            BLE_LOGE(TAG, "Custom button delay out of range: %ums", delay);
            return 0;
        }
        set_custom_button_delay(delay);
        return 1;
    }

    case SETTING_FLAG_AUX_STATUS:
        if (size != 2 || data[1] > AUX_ENABLED) {
            BLE_LOGE(TAG, "Invalid aux status packet (size=%u)", (unsigned int)size);
            return 0;
        }
        set_aux_status(data[1]);
        return 1;

    case SETTING_FLAG_WAVE_DELAY:
        if (size != 2 || data[1] > WAVE_DELAY_MAX) {
            BLE_LOGE(TAG, "Invalid wave delay packet (size=%u)", (unsigned int)size);
            return 0;
        }
        set_wave_delay(data[1]);
        return 1;

    case SETTING_FLAG_SLEEPY_EYE:
        if (size != (1 + SLEEPY_PACKET_LEN) || !validate_sleepy_values(&data[1], size - 1)) {
            BLE_LOGE(TAG, "Invalid sleepy settings packet (size=%u)", (unsigned int)size);
            return 0;
        }
        set_sleepy_eye_values(data[1], data[2]);
        return 1;

    case SETTING_FLAG_HEADLIGHT_BYPASS:
        if (size != 2 || data[1] > BYPASS_ENABLED) {
            BLE_LOGE(TAG, "Invalid headlight bypass packet (size=%u)", (unsigned int)size);
            return 0;
        }
        set_input_headlight_bypass(data[1]);
        return 1;

    case SETTING_FLAG_ORIENTATION:
        if (size != 2 || data[1] > ORIENTATION_SWAPPED) {
            BLE_LOGE(TAG, "Invalid orientation packet (size=%u)", (unsigned int)size);
            return 0;
        }
        set_module_orientation(data[1]);
        return 1;

    case SETTING_FLAG_LONG_TERM_SLEEP:
        if (size != 1) {
            BLE_LOGE(TAG, "Invalid long-term sleep packet (size=%u)", (unsigned int)size);
            return 0;
        }
        enter_long_term_sleep();
        return 1;

    case SETTING_FLAG_UNPAIR:
        if (size != 1) {
            BLE_LOGE(TAG, "Invalid unpair packet (size=%u)", (unsigned int)size);
            return 0;
        }
        unpair_module();
        return 1;

    case SETTING_FLAG_RESET:
        if (size != 1) {
            BLE_LOGE(TAG, "Invalid reset packet (size=%u)", (unsigned int)size);
            return 0;
        }
        reset_module();
        return 1;

    default: BLE_LOGE(TAG, "Unknown general setting flag: 0x%02X", flag); return 0;
    }
}

void set_module_orientation(uint8_t orientation) {
    if (orientation > ORIENTATION_SWAPPED)
        return;

    uint8_t changed = (module_orientation != orientation);
    module_orientation = orientation;
    set_nvs_orientation(orientation);

    if (changed) {
        swap_position_sides();
        swap_move_time_sides();
        ble_notify_headlight_status();
        const uint8_t notify_payload[2] = { SETTING_FLAG_ORIENTATION, orientation };
        ble_notify_general_settings(notify_payload, sizeof(notify_payload));
    }

    BLE_LOGI(TAG, "Module orientation set to %s", orientation == ORIENTATION_SWAPPED ? "OUTSIDE" : "CABIN");
}

uint8_t get_module_orientation() {
    return module_orientation;
}

static volatile uint8_t long_term_sleep_requested = 0;

uint8_t is_long_term_sleep_requested() {
    return long_term_sleep_requested;
}

static void long_term_sleep_task(void* args) {
    // Allow BLE GATT Write Response to be transmitted before disconnecting and sleeping
    vTaskDelay(pdMS_TO_TICKS(200));

    reset_auth_on_disconnect();
    ble_disconnect();

    vTaskDelay(pdMS_TO_TICKS(100));
    configure_wakeup_sources(0);
    esp_deep_sleep_start();
}

static void deferred_disconnect_task(void* args) {
    uint32_t delay_ms = (uint32_t)(uintptr_t)args;
    vTaskDelay(pdMS_TO_TICKS(delay_ms));
    reset_auth_on_disconnect();
    ble_disconnect();
    vTaskDelete(NULL);
}

void enter_long_term_sleep() {
    BLE_LOGI(TAG, "Entering long-term sleep");
    long_term_sleep_requested = 1;
    xTaskCreate(long_term_sleep_task, "SLEEP_TASK", 4096, NULL, tskIDLE_PRIORITY + 2, NULL);
}

void unpair_module() {
    BLE_LOGI(TAG, "Unpairing module");

    delete_nvs_device_key();
    xTaskCreate(deferred_disconnect_task, "DISC_TASK", 4096, (void*)(uintptr_t)200, tskIDLE_PRIORITY + 2, NULL);
}

void reset_module() {
    BLE_LOGI(TAG, "Resetting module to factory defaults");

    seed_nvs_defaults();

    reload_button_bindings();
    reload_aux();
    reload_move_times();
    set_sleepy_eye_values(50, 50);
    set_wave_delay(50);
    set_input_headlight_bypass(BYPASS_DISABLED);
    set_module_orientation(ORIENTATION_DEFAULT);

    request_command_cancellation();
    xQueueReset(command_output_queue);
    xQueueReset(custom_command_queue_handle);

    const command_types_t confirm_seq[3] = {
        COMMAND_LEFT_WINK,
        COMMAND_RIGHT_WINK,
        COMMAND_BOTH_BLINK,
    };
    for (uint8_t i = 0; i < 3; i++)
        xQueueSend(command_output_queue, &confirm_seq[i], 0);

    reset_sleep_on_disconnect();
    xTaskCreate(deferred_disconnect_task, "DISC_TASK", 4096, (void*)(uintptr_t)300, tskIDLE_PRIORITY + 2, NULL);
}
