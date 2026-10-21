#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include <esp_sleep.h>
#include <string.h>

#include "ble/debugger/ble_debugger.h"
#include "button_bindings.h"
#include "custom_command_output.h"
#include "storage_handler.h"

static const char* TAG = "BND";


// check wakeup reason on boot, if not from a sleep wakeup, read from nvs to set
RTC_DATA_ATTR button_config_t button_config = { 0 };
static SemaphoreHandle_t bindings_lock;

void init_button_bindings() {
    bindings_lock = xSemaphoreCreateMutex();

    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED)
        load_nvs_button_config(&button_config);
}

void reload_button_bindings() {
    xSemaphoreTake(bindings_lock, portMAX_DELAY);
    load_nvs_button_config(&button_config);
    xSemaphoreGive(bindings_lock);
}

void set_binding_at_pos(button_binding_t* binding, uint8_t pos) {
    if (binding == NULL || pos >= NUM_BINDINGS)
        return;

    if (binding->type == BINDING_NONE) {
        delete_binding_at_pos(pos);
        return;
    }

    xSemaphoreTake(bindings_lock, portMAX_DELAY);
    button_config.bindings[pos] = *binding;
    set_nvs_binding(binding, pos);
    xSemaphoreGive(bindings_lock);

    BLE_LOGD(TAG, "Binding pos %u saved (%s)", pos, binding_type_to_str(binding->type));
}

void get_binding_at_pos(button_binding_t* binding, uint8_t pos) {
    if (binding == NULL)
        return;

    if (pos >= NUM_BINDINGS) {
        memset(binding, 0, sizeof(button_binding_t));
        binding->type = BINDING_NONE;
        return;
    }

    xSemaphoreTake(bindings_lock, portMAX_DELAY);
    *binding = button_config.bindings[pos];
    xSemaphoreGive(bindings_lock);
}

void delete_binding_at_pos(uint8_t pos) {
    if (pos >= NUM_BINDINGS) {
        BLE_LOGE(TAG, "Invalid aux position of %d", pos);
        return;
    }

    xSemaphoreTake(bindings_lock, portMAX_DELAY);

    for (uint8_t i = pos; i < (NUM_BINDINGS - 1); i++)
        button_config.bindings[i] = button_config.bindings[i + 1];

    memset(&button_config.bindings[NUM_BINDINGS - 1], 0, sizeof(button_binding_t));
    button_config.bindings[NUM_BINDINGS - 1].type = BINDING_NONE;

    delete_nvs_binding(pos);
    xSemaphoreGive(bindings_lock);

    BLE_LOGD(TAG, "Binding pos %u deleted", pos);
}


void set_custom_button_status(uint8_t status) {
    if (status != 0 && status != 1)
        return;

    xSemaphoreTake(bindings_lock, portMAX_DELAY);
    button_config.custom_actions_enabled = status;
    set_nvs_button_status(status);
    xSemaphoreGive(bindings_lock);

    BLE_LOGI(TAG, "Custom button status: %u", status);
}
uint8_t get_custom_button_status() {
    return button_config.custom_actions_enabled;
}

void set_custom_button_delay(uint16_t delay) {
    if (delay == 0)
        return;

    xSemaphoreTake(bindings_lock, portMAX_DELAY);
    button_config.button_delay_ms = delay;
    set_nvs_button_delay(delay);
    xSemaphoreGive(bindings_lock);

    BLE_LOGI(TAG, "Custom button delay: %ums", delay);
}
uint16_t get_custom_button_delay() {
    return button_config.button_delay_ms;
}


// returns 1 for success and 0 for any errors/invalid bindings
uint8_t validate_button_binding(button_binding_t* binding, size_t size) {

    if (binding == NULL)
        return 0;

    if (size < MIN_BINDING_PAYLOAD_LEN || size > sizeof(button_binding_t)) {
        BLE_LOGD(TAG, "Invalid binding size: %u", (unsigned int)size);
        return 0;
    }


    // BINDING_SETTING is not valid for an OEM button binding
    // only applys for AUX buttons (eg: using a toggle switch to change a setting)
    if (binding->type > BINDING_CUSTOM_SEQUENCE) {
        BLE_LOGD(TAG, "Invalid binding type: %u", binding->type);
        return 0;
    }

    // default to fail
    uint8_t cmd_val_res = 0;
    // if we have a custom command binding, just use the custom command validator
    if (binding->type == BINDING_CUSTOM_SEQUENCE)
        // custom command data will have a size of whatever the rest of the packet is after the type
        cmd_val_res = validate_custom_command(&(binding->data.custom), (size - BINDING_TYP_LEN));
    else if (binding->type == BINDING_BUILTIN) {
        if ((size == (BINDING_TYP_LEN + sizeof(command_t))) && (binding->data.builtin >= COMMAND_BOTH_UP) && (binding->data.builtin <= COMMAND_SLEEPY_EYE))
            cmd_val_res = 1;
        else
            BLE_LOGD(TAG, "Invalid builtin cmd: 0x%02X (size=%u)", binding->data.builtin, (unsigned int)size);
    }


    return cmd_val_res;
}