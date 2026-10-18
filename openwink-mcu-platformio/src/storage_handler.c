#include <freertos/FreeRTOS.h>
#include <freertos/FreeRTOSConfig.h>

#include <esp_err.h>
#include <nvs_flash.h>

#include "storage_handler.h"

nvs_handle_t storage_handle;
const char* nvs_namespace = "ow_ns";
const char* auth_key = "auth";

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


uint8_t device_key_exists() {
    if (open(NVS_READONLY) != ESP_OK)
        return 0;

    size_t required_size = 0;
    esp_err_t err = nvs_get_blob(storage_handle, auth_key, NULL, &required_size);
    close();

    return (err == ESP_OK && required_size > 0) ? 1 : 0;
}

void set_device_key(uint8_t* data, size_t size) {
    if (open(NVS_READWRITE) != ESP_OK)
        return;

    nvs_set_blob(storage_handle, auth_key, data, size);
    nvs_commit(storage_handle);
    close();
}

void get_device_key(uint8_t* data, size_t size) {
    if (open(NVS_READONLY) != ESP_OK)
        return;

    nvs_get_blob(storage_handle, auth_key, data, &size);
    close();
}

void delete_device_key() {
    if (open(NVS_READWRITE) != ESP_OK)
        return;

    nvs_erase_key(storage_handle, auth_key);
    nvs_commit(storage_handle);
    close();
}