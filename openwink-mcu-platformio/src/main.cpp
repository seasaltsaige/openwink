#include "gpio_conf.h"
#include "input_intr.h"
#include "tasks_init.h"
#include "wakeup_handle.h"

extern "C" void app_main()
{
    INIT_gpio();
    INIT_intr();
    enable_wakeup_sources();
}