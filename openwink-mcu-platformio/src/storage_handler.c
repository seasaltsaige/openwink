#include <freertos/FreeRTOS.h>
#include <freertos/FreeRTOSConfig.h>

#include <esp_err.h>
#include <nvs_flash.h>

#include "storage_handler.h"

nvs_handle_t storage_handle;
const char* nvs_namespace = "openwink";

void init_nvs_storage()
{
    esp_err_t nvs_res = nvs_flash_init();
    if (nvs_res == ESP_ERR_NVS_NO_FREE_PAGES || nvs_res == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        nvs_flash_erase();
        nvs_flash_init();
    }
}

static void open(nvs_open_mode_t mode)
{
    nvs_open(nvs_namespace, mode, &storage_handle);
}

static void close()
{
    nvs_close(storage_handle);
}