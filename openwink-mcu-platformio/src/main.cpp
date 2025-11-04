#include "ble/ble.h"
#include "config/gpio_conf.h"
#include "config/interrupt_conf.h"
#include "config/tasks_conf.h"
#include "handler/nvs.h"
#include "handler/queue.h"
#include "handler/wakeup.h"


extern "C" void app_main()
{
    // Setup GPIO pins to receive inputs and send outputs as needed
    INIT_gpio();
    // Setup GPIO pin interrupt service routines to handle button/motion inputs
    INIT_intr();
    // Enable wakeup sources on startup; By default enables both GPIO wakeup AND Timer wakeup
    INIT_wakeup_sources();

    // Initialize queues for commands/inputs
    INIT_queues();

    // Initialize NVS for BLE / storing module customizations
    NVS::init();

    // Initiate and start advertising BLE server
    // Not necessary in preliminary testing
    INIT_nimble_device("OpenWink");
    // Start main code functionality
    INIT_tasks();
}