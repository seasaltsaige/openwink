#include "ble/ble.h"
#include "gpio_conf.h"
#include "input_intr.h"
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

    // Initiate and start advertising BLE server
    INIT_nimble_device("OpenWink");
    // Start main code functionality
    INIT_tasks();
}