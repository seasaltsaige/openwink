#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "aux_input.h"
#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "ble/ota_handler.h"
#include "ble/pairing_auth.h"
#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "module_settings.h"
#include "output_handler.h"
#include "sleep_handler.h"
#include "storage_handler.h"

#include <esp_log.h>
#include <esp_sleep.h>

void app_main() {
    uint8_t cold_boot = (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED);

    // On cold boot, initialize NVS before loading settings into RTC memory
    if (cold_boot)
        init_nvs_storage();

    init_module_settings();
    init_sleep_handler();

    // gpio init
    outputs_init();
    inputs_init();
    monitor_gpio_init();
    monitor_event_group_init();
    // queues init
    output_queue_init();
    output_event_group_init();
    init_command_queue();
    init_custom_command_queue();

    // initialize button bindings
    init_button_bindings();
    init_aux();

    // read initial input states
    read_input_on_boot();

    init_auth();
    init_ble_debugger();
    init_ota();

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

    // Start input, monitor, output, and command tasks before NVS/BLE init on wake
    // so wakeup button presses and multi-press sequences are captured immediately
    xTaskCreate(input_read_task, "INPUT_TASK", 4096, NULL, tskIDLE_PRIORITY + 5, NULL);
    xTaskCreate(aux_one_input_task, "AUX_1_TASK", 4096, NULL, tskIDLE_PRIORITY + 5, &aux_one_task_handle);
    xTaskCreate(aux_two_input_task, "AUX_2_TASK", 4096, NULL, tskIDLE_PRIORITY + 5, &aux_two_task_handle);
    xTaskCreate(left_monitor_task, "L_MON_TASK", 4096, NULL, tskIDLE_PRIORITY + 5, &left_feedback_task);
    xTaskCreate(right_monitor_task, "R_MON_TASK", 4096, NULL, tskIDLE_PRIORITY + 5, &right_feedback_task);
    xTaskCreate(handle_output_task, "L_OUT_TASK", 4096, (void*)&left_args, tskIDLE_PRIORITY + 4, NULL);
    xTaskCreate(handle_output_task, "R_OUT_TASK", 4096, (void*)&right_args, tskIDLE_PRIORITY + 4, NULL);
    xTaskCreate(handle_command_task, "DEF_CMD_TASK", 4096, NULL, tskIDLE_PRIORITY + 3, &command_output_task);
    // least important task to execute
    xTaskCreate(custom_command_task, "CUS_CMD_TASK", 4096, NULL, tskIDLE_PRIORITY + 2, &custom_command_task_handle);

    if (!cold_boot)
        init_nvs_storage();

    // BLE init & tasks
    ble_init(DEVICE_NAME);
    xTaskCreate(auth_task, "AUTH_TASK", 4096, NULL, tskIDLE_PRIORITY + 3, &auth_task_handle);
    xTaskCreate(ble_debug_task, "BLE_DBG_TASK", 4096, NULL, tskIDLE_PRIORITY + 1, &ble_debug_task_handle);

    // finally start advertising self
    begin_advertising();

    xTaskCreate(sleep_task, "SLEEP_TASK", 4096, NULL, tskIDLE_PRIORITY + 1, NULL);

    // main task doesnt need to do anything really.
    // perhaps it can handle auth in the future,
    // though I think something should individually own that.
    for (;;)
        vTaskDelay(pdMS_TO_TICKS(100));
}