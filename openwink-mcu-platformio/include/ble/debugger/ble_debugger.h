#ifndef BLE_DEBUGGER_H
#define BLE_DEBUGGER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <stddef.h>

#include "aux_input.h"
#include "button_bindings.h"
#include "command_output.h"
#include "output_handler.h"

#define BLE_DEBUG_BUF_SIZE 2048
#define BLE_DEBUG_MAX_LINE_LEN 160
#define BLE_DEBUG_CHUNK_SIZE 180
#define BLE_DEBUG_TX_DELAY_MS 15

typedef enum BLE_DEBUG_LEVELS : uint8_t {
    BLE_DEBUG_NONE,
    BLE_DEBUG_ERROR,
    BLE_DEBUG_WARN,
    BLE_DEBUG_INFO,
    BLE_DEBUG_DEBUG,
    BLE_DEBUG_VERBOSE,
} ble_debug_level_t;// mimics esp_log

extern TaskHandle_t ble_debug_task_handle;

#ifdef __cplusplus
extern "C" {
#endif

void init_ble_debugger();
void reset_debugger_on_disconnect();

// returns 1 for success and 0 for invalid level packet
uint8_t validate_debug_level(const uint8_t* data, size_t size);
void set_debug_level(ble_debug_level_t level);
ble_debug_level_t get_debug_level();

void set_debug_subscribed(uint8_t subscribed);
uint8_t get_debug_subscribed();

const char* debug_level_to_str(ble_debug_level_t level);
const char* command_to_str(command_types_t cmd);
const char* move_type_to_str(move_type_t type);
const char* side_to_str(uint8_t side);
const char* binding_type_to_str(button_bindings_type_t type);
const char* aux_side_to_str(aux_side_t side);
const char* aux_status_to_str(aux_status_t status);
const char* aux_type_to_str(aux_type_t type);

void ble_log(ble_debug_level_t level, const char* tag, const char* fmt, ...) __attribute__((format(printf, 3, 4)));
void ble_debug_task(void* args);

#define BLE_LOG(level, tag, fmt, ...)                          \
    do {                                                       \
        if (get_debug_level() >= (level))                      \
            ble_log((level), (tag), (fmt), ##__VA_ARGS__);     \
    } while (0)

#define BLE_LOGE(tag, fmt, ...) BLE_LOG(BLE_DEBUG_ERROR, tag, fmt, ##__VA_ARGS__)
#define BLE_LOGW(tag, fmt, ...) BLE_LOG(BLE_DEBUG_WARN, tag, fmt, ##__VA_ARGS__)
#define BLE_LOGI(tag, fmt, ...) BLE_LOG(BLE_DEBUG_INFO, tag, fmt, ##__VA_ARGS__)
#define BLE_LOGD(tag, fmt, ...) BLE_LOG(BLE_DEBUG_DEBUG, tag, fmt, ##__VA_ARGS__)
#define BLE_LOGV(tag, fmt, ...) BLE_LOG(BLE_DEBUG_VERBOSE, tag, fmt, ##__VA_ARGS__)

#ifdef __cplusplus
}
#endif

#endif
