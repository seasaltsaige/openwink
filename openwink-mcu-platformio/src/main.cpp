#include "../include/common.h"
#include "ble/ble.h"
#include "gpio_conf.h"
#include "handler/nvs.h"
#include "handler/wakeup.h"
#include "input_intr.h"
#include "tasks_init.h"


extern "C" void app_main()
{
    // Setup GPIO pins to receive inputs and send outputs as needed
    INIT_gpio();
    // Setup GPIO pin interrupt service routines to handle button/motion inputs
    INIT_intr();
    // Enable wakeup sources on startup; By default enables both GPIO wakeup AND Timer wakeup
    INIT_wakeup_sources();

    NVS::init();

    // Initiate and start advertising BLE server
    // Not necessary in preliminary testing
    INIT_nimble_device("OpenWink");
    // Start main code functionality
    INIT_tasks();
}