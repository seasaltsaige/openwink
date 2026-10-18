#include <esp_err.h>
#include <freertos/FreeRTOS.h>
#include <freertos/FreeRTOSConfig.h>
#include <nvs_flash.h>
#include <string.h>

#include "button_bindings.h"
#include "storage_handler.h"

static nvs_handle_t storage_handle;

// "openwink namespace"
static const char* nvs_namespace = "ow_ns";

static const char* nvs_seeded = "seed";
static const char* auth_key = "auth";
static const char* btn_status_key = "btn_en";
static const char* btn_delay_key = "btn_delay";
static const char* binding_keys[NUM_BINDINGS] = {
    "bind_0",
    "bind_1",
    "bind_2",
    "bind_3",
    "bind_4",
    "bind_5",
    "bind_6",
    "bind_7",
};


// ---- Internal Static NVS Helpers ---- //

static esp_err_t open(nvs_open_mode_t mode) {
    return nvs_open(nvs_namespace, mode, &storage_handle);
}

static void close() {
    nvs_close(storage_handle);
}

static void write_u8(const char* key, uint8_t val) {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_u8(storage_handle, key, val);
    nvs_commit(storage_handle);
    close();
}

static esp_err_t read_u8(const char* key, uint8_t* out) {
    if (out == NULL || open(NVS_READONLY) != ESP_OK)
        return ESP_FAIL;
    esp_err_t err = nvs_get_u8(storage_handle, key, out);
    close();
    return err;
}

static void write_u16(const char* key, uint16_t val) {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_u16(storage_handle, key, val);
    nvs_commit(storage_handle);
    close();
}

static esp_err_t read_u16(const char* key, uint16_t* out) {
    if (out == NULL || open(NVS_READONLY) != ESP_OK)
        return ESP_FAIL;
    esp_err_t err = nvs_get_u16(storage_handle, key, out);
    close();
    return err;
}

static void write_blob(const char* key, const void* data, size_t size) {
    if (data == NULL || open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_blob(storage_handle, key, data, size);
    nvs_commit(storage_handle);
    close();
}

static esp_err_t read_blob(const char* key, void* out, size_t size) {
    if (out == NULL || open(NVS_READONLY) != ESP_OK)
        return ESP_FAIL;
    esp_err_t err = nvs_get_blob(storage_handle, key, out, &size);
    close();
    return err;
}

static void erase_key(const char* key) {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_erase_key(storage_handle, key);
    nvs_commit(storage_handle);
    close();
}


// initialize nvs storage and seed storage if necessary
void init_nvs_storage() {
    esp_err_t nvs_res = nvs_flash_init();
    if (nvs_res == ESP_ERR_NVS_NO_FREE_PAGES || nvs_res == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        nvs_flash_init();
    }

    if (get_nvs_seeded() <= 0)
        seed_nvs_defaults();
}

uint8_t device_nvs_key_exists() {
    if (open(NVS_READONLY) != ESP_OK)
        return 0;
    size_t required_size = 0;
    esp_err_t err = nvs_get_blob(storage_handle, auth_key, NULL, &required_size);
    close();
    return (err == ESP_OK && required_size > 0) ? 1 : 0;
}
void set_nvs_device_key(uint8_t* data, size_t size) {
    write_blob(auth_key, data, size);
}
void get_nvs_device_key(uint8_t* data, size_t size) {
    read_blob(auth_key, data, size);
}
void delete_nvs_device_key() {
    erase_key(auth_key);
}

void set_nvs_button_status(uint8_t status) {
    write_u8(btn_status_key, status);
}
void get_nvs_button_status(uint8_t* status) {
    read_u8(btn_status_key, status);
}
void set_nvs_button_delay(uint16_t delay) {
    write_u16(btn_delay_key, delay);
}
void get_nvs_button_delay(uint16_t* delay) {
    read_u16(btn_delay_key, delay);
}

void set_nvs_binding(const button_binding_t* binding, uint8_t pos) {
    if (binding == NULL || pos >= NUM_BINDINGS)
        return;
    if (binding->type == BINDING_NONE) {
        delete_nvs_binding(pos);
        return;
    }
    write_blob(binding_keys[pos], binding, sizeof(button_binding_t));
}
void get_nvs_binding(button_binding_t* binding, uint8_t pos) {
    if (binding == NULL || pos >= NUM_BINDINGS)
        return;
    memset(binding, 0, sizeof(button_binding_t));
    binding->type = BINDING_NONE;
    read_blob(binding_keys[pos], binding, sizeof(button_binding_t));
}
void delete_nvs_binding(uint8_t pos) {
    if (pos >= NUM_BINDINGS || open(NVS_READWRITE) != ESP_OK)
        return;

    button_binding_t next_binding;
    for (uint8_t i = pos; i < (NUM_BINDINGS - 1); i++) {
        memset(&next_binding, 0, sizeof(button_binding_t));
        size_t size = sizeof(button_binding_t);
        esp_err_t err = nvs_get_blob(storage_handle, binding_keys[i + 1], &next_binding, &size);

        if (err == ESP_OK && next_binding.type != BINDING_NONE)
            nvs_set_blob(storage_handle, binding_keys[i], &next_binding, sizeof(button_binding_t));
        else
            nvs_erase_key(storage_handle, binding_keys[i]);
    }

    nvs_erase_key(storage_handle, binding_keys[NUM_BINDINGS - 1]);
    nvs_commit(storage_handle);
    close();
}
void load_nvs_button_config(button_config_t* config) {
    if (config == NULL || open(NVS_READONLY) != ESP_OK)
        return;

    nvs_get_u8(storage_handle, btn_status_key, &config->custom_actions_enabled);
    nvs_get_u16(storage_handle, btn_delay_key, &config->button_delay_ms);

    for (uint8_t i = 0; i < NUM_BINDINGS; i++) {
        memset(&config->bindings[i], 0, sizeof(button_binding_t));
        config->bindings[i].type = BINDING_NONE;

        size_t size = sizeof(button_binding_t);
        nvs_get_blob(storage_handle, binding_keys[i], &config->bindings[i], &size);
    }

    close();
}

int8_t get_nvs_seeded() {
    uint8_t seeded = 0;
    esp_err_t err = read_u8(nvs_seeded, &seeded);
    return (err == ESP_OK) ? (int8_t)seeded : -1;
}
void seed_nvs_defaults() {
    if (open(NVS_READWRITE) != ESP_OK)
        return;

    nvs_erase_all(storage_handle);

    nvs_set_u8(storage_handle, btn_status_key, 1);
    nvs_set_u16(storage_handle, btn_delay_key, 500);

    const command_t default_cmds[4] = {
        COMMAND_LEFT_WINK,
        COMMAND_RIGHT_WINK,
        COMMAND_BOTH_BLINK,
        COMMAND_SLEEPY_EYE,
    };

    for (uint8_t i = 0; i < 4; i++) {
        button_binding_t b = {
            .type = BINDING_BUILTIN,
            .data.builtin = default_cmds[i],
        };
        nvs_set_blob(storage_handle, binding_keys[i], &b, sizeof(button_binding_t));
    }

    nvs_set_u8(storage_handle, nvs_seeded, 1);
    nvs_commit(storage_handle);
    close();
}