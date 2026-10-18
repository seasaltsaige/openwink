#include <esp_err.h>
#include <freertos/FreeRTOS.h>
#include <freertos/FreeRTOSConfig.h>
#include <nvs_flash.h>

#include "button_bindings.h"
#include "storage_handler.h"

nvs_handle_t storage_handle;
// "openwink namespace"
const char* nvs_namespace = "ow_ns";

const char* nvs_seeded = "seed";
const char* auth_key = "auth";
const char* btn_status_key = "btn_en";
const char* btn_delay_key = "btn_delay";
const char* binding_keys[NUM_BINDINGS] = {
    "bind_0",
    "bind_1",
    "bind_2",
    "bind_3",
    "bind_4",
    "bind_5",
    "bind_6",
    "bind_7",
};


void init_nvs_storage() {
    esp_err_t nvs_res = nvs_flash_init();
    if (nvs_res == ESP_ERR_NVS_NO_FREE_PAGES || nvs_res == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        nvs_flash_init();
    }
}

static esp_err_t open(nvs_open_mode_t mode) {
    return nvs_open(nvs_namespace, mode, &storage_handle);
}

static void close() {
    nvs_close(storage_handle);
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
    if (open(NVS_READWRITE) != ESP_OK)
        return;

    nvs_set_blob(storage_handle, auth_key, data, size);
    nvs_commit(storage_handle);
    close();
}
void get_nvs_device_key(uint8_t* data, size_t size) {
    if (open(NVS_READONLY) != ESP_OK)
        return;

    nvs_get_blob(storage_handle, auth_key, data, &size);
    close();
}
void delete_nvs_device_key() {
    if (open(NVS_READWRITE) != ESP_OK)
        return;

    nvs_erase_key(storage_handle, auth_key);
    nvs_commit(storage_handle);
    close();
}

void set_nvs_button_status(uint8_t status) {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_u8(storage_handle, btn_status_key, status);
    nvs_commit(storage_handle);
    close();
}
void get_nvs_button_status(uint8_t* status) {
    if (open(NVS_READONLY) != ESP_OK)
        return;
    nvs_get_u8(storage_handle, btn_status_key, status);
    close();
}
void set_nvs_button_delay(uint16_t delay) {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_u16(storage_handle, btn_delay_key, delay);
    nvs_commit(storage_handle);
    close();
}
void get_nvs_button_delay(uint16_t* delay) {
    if (open(NVS_READONLY) != ESP_OK)
        return;
    nvs_get_u16(storage_handle, btn_delay_key, delay);
    close();
}

void set_nvs_binding(const button_binding_t* binding, uint8_t pos) {
    if (pos >= NUM_BINDINGS || open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_blob(storage_handle, binding_keys[pos], binding, sizeof(button_binding_t));
    nvs_commit(storage_handle);
    close();
}
void get_nvs_binding(button_binding_t* binding, uint8_t pos) {
    if (pos >= NUM_BINDINGS || open(NVS_READONLY) != ESP_OK)
        return;
    size_t size = sizeof(button_binding_t);
    nvs_get_blob(storage_handle, binding_keys[pos], binding, &size);
    close();
}
void delete_nvs_binding(uint8_t pos) {
    if (pos >= NUM_BINDINGS || open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_erase_key(storage_handle, binding_keys[pos]);
    nvs_commit(storage_handle);
    close();
}


void set_nvs_seed() {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_set_u8(storage_handle, nvs_seeded, 1);
    nvs_commit(storage_handle);
    close();
}
int8_t get_nvs_seeded() {
    if (open(NVS_READWRITE) != ESP_OK)
        return -1;
    uint8_t seeded;
    nvs_get_u8(storage_handle, nvs_seeded, &seeded);
    close();
    return seeded;
}
void delete_nvs_seed() {
    if (open(NVS_READWRITE) != ESP_OK)
        return;
    nvs_erase_key(storage_handle, nvs_seeded);
    nvs_commit(storage_handle);
    close();
}