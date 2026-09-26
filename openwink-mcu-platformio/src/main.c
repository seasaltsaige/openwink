#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

#include <esp_log.h>

void app_main()
{
    // gpio init
    outputs_init();
    inputs_init();
    monitor_gpio_init();
    monitor_event_group_init();
    // queues init
    output_queue_init();
    output_event_group_init();
    init_command_queue();


    read_input_on_boot();

    output_args_t left_args = {
        .down_pin = OUT_PIN_LEFT_DOWN,
        .up_pin = OUT_PIN_LEFT_UP,
        .queue = left_output_queue,
        .side_bit = LEFT_SIDE,
        .stopped_bit = LEFT_STOPPED_BIT,
        .move_complete_bit = LEFT_COMPLETE_BIT,
    };

    output_args_t right_args = {
        .down_pin = OUT_PIN_RIGHT_DOWN,
        .up_pin = OUT_PIN_RIGHT_UP,
        .queue = right_output_queue,
        .side_bit = RIGHT_SIDE,
        .stopped_bit = RIGHT_STOPPED_BIT,
        .move_complete_bit = RIGHT_COMPLETE_BIT,
    };

    // initialize tasks
    xTaskCreate(input_read_task, "INPUT_TASK", 2048, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(left_monitor_task, "L_MON_TASK", configMINIMAL_STACK_SIZE, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(right_monitor_task, "R_MON_TASK", configMINIMAL_STACK_SIZE, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(handle_output_task, "L_OUT_TASK", configMINIMAL_STACK_SIZE, (void*)&left_args, tskIDLE_PRIORITY + 4, NULL);
    xTaskCreate(handle_output_task, "R_OUT_TASK", configMINIMAL_STACK_SIZE, (void*)&right_args, tskIDLE_PRIORITY + 4, NULL);
    xTaskCreate(handle_command_task, "DEF_CMD_TASK", 2048, NULL, tskIDLE_PRIORITY + 3, &command_output_task);

    // main task doesnt need to do anything really.
    // perhaps it can handle auth in the future,
    // though I think something should individually own that.

    for (;;)
    {
        vTaskDelay(pdTICKS_TO_MS(100));
    }
}