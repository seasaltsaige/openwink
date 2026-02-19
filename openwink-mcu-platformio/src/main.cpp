#include "ble/ble.h"
#include "config/gpio_conf.h"
#include "config/inter_conf.h"
#include "config/tasks_conf.h"
#include "globals.h"
#include "handler/nvs.h"
#include "handler/wakeup.h"


extern "C" void app_main()
{
    // Setup GPIO pins to receive inputs and send outputs as needed
    INIT_gpio();
    // Enable wakeup sources on startup; By default enables both GPIO wakeup AND Timer wakeup
    INIT_wakeup_sources();
    // Initialize NVS for BLE / storing module customizations
    NVS::init();
    // Load saved settings
    Settings::load_from_flash();
    // Initiate and start advertising BLE server
    // Not necessary in preliminary testing
    INIT_nimble_device("OpenWink");
    // Init interrupt service routines
    INIT_inter();
    // Start main code functionality
    INIT_tasks();
}