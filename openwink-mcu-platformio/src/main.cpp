#include "../include/common.h"
#include "ble/ble.h"
#include "gpio_conf.h"
#include "input_intr.h"
#include "nvs_flash.h"
#include "tasks_init.h"
#include "wakeup_handle.h"


extern "C" void app_main()
{
    // Setup GPIO pins to receive inputs and send outputs as needed
    INIT_gpio();
    // Setup GPIO pin interrupt service routines to handle button/motion inputs
    INIT_intr();
    // Enable wakeup sources on startup; By default enables both GPIO wakeup AND Timer wakeup
    enable_wakeup_sources();

    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err);

    // Initiate and start advertising BLE server
    // Not necessary in preliminary testing
    INIT_nimble_device("OpenWink");
    // Start main code functionality
    INIT_tasks();
}