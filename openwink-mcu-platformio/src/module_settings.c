#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "aux_input.h"
#include "ble/debugger/ble_debugger.h"
#include "button_bindings.h"
#include "button_input.h"
#include "command_output.h"
#include "module_settings.h"
#include "output_handler.h"
#include "storage_handler.h"

static const char* TAG = "SET";

RTC_DATA_ATTR static uint8_t module_orientation = ORIENTATION_DEFAULT;

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

    default:
        BLE_LOGE(TAG, "Unknown general setting flag: 0x%02X", flag);
        return 0;
    }
}

void set_module_orientation(uint8_t orientation) {
    if (orientation > ORIENTATION_SWAPPED)
        return;

    module_orientation = orientation;
    BLE_LOGI(TAG, "Module orientation set to %s", orientation == ORIENTATION_SWAPPED ? "SWAPPED" : "DEFAULT");
    // TODO: Apply orientation to output_handler / headlight_feedback and persist to NVS
}

uint8_t get_module_orientation() {
    return module_orientation;
}

void enter_long_term_sleep() {
    BLE_LOGI(TAG, "Entering long-term sleep");
    // TODO: Implement deep sleep entry
}

void unpair_module() {
    BLE_LOGI(TAG, "Unpairing module");
    // TODO: Delete device key from NVS and reset auth state
}

void reset_module() {
    BLE_LOGI(TAG, "Resetting module to factory defaults");
    // TODO: Reseed NVS defaults, reload runtime state across modules, and unpair
}
