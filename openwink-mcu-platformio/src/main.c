#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

void app_main()
{
    // gpio init
    outputs_init();
    inputs_init();
    monitor_gpio_init();
    // queues init
    output_queue_init();
    init_command_queue();
    // initialize tasks
    xTaskCreate(input_read_task, "INPUT_TASK", 1024, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(left_monitor_task, "L_MON_TASK", 1024, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(right_monitor_task, "R_MON_TASK", 1024, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(handle_output_task, "OUT_TASK", 1024, NULL, tskIDLE_PRIORITY + 4, NULL);
    xTaskCreate(handle_command_task, "DEF_CMD_TASK", 2048, NULL, tskIDLE_PRIORITY + 3, command_output_task);

    // main task doesnt need to do anything really.
    // perhaps it can handle auth in the future,
    // though I think something should individually own that.
}