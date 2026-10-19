#ifndef BLE_DEBUGGER_H
#define BLE_DEBUGGER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

typedef enum BLE_DEBUG_LEVELS : uint8_t {
    BLE_DEBUG_NONE,
    BLE_DEBUG_ERROR,
    BLE_DEBUG_WARN,
    BLE_DEBUG_INFO,
    BLE_DEBUG_DEBUG,
    BLE_DEBUG_VERBOSE,
} ble_debug_level_t;// mimics esp_log

void set_debug_level(ble_debug_level_t level);
void get_debug_level();

void print_log(char* log);

#endif