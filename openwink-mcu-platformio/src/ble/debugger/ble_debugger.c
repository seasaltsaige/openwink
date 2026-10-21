#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include <stdarg.h>
#include <stdio.h>
#include <string.h>

#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "ble/pairing_auth.h"
#include "headlight_feedback.h"

static const char* TAG = "DBG";

TaskHandle_t ble_debug_task_handle = NULL;

static SemaphoreHandle_t debug_lock = NULL;
static ble_debug_level_t current_debug_level = BLE_DEBUG_NONE;
static uint8_t client_subscribed = 0;

static char log_ring_buf[BLE_DEBUG_BUF_SIZE];
static size_t buf_head = 0;
static size_t buf_tail = 0;
static size_t buf_count = 0;
static uint32_t dropped_logs = 0;

static char level_to_char(ble_debug_level_t level) {
    switch (level) {
    case BLE_DEBUG_ERROR: return 'E';
    case BLE_DEBUG_WARN: return 'W';
    case BLE_DEBUG_INFO: return 'I';
    case BLE_DEBUG_DEBUG: return 'D';
    case BLE_DEBUG_VERBOSE: return 'V';
    default: return '?';
    }
}

const char* debug_level_to_str(ble_debug_level_t level) {
    switch (level) {
    case BLE_DEBUG_NONE: return "NONE";
    case BLE_DEBUG_ERROR: return "ERROR";
    case BLE_DEBUG_WARN: return "WARN";
    case BLE_DEBUG_INFO: return "INFO";
    case BLE_DEBUG_DEBUG: return "DEBUG";
    case BLE_DEBUG_VERBOSE: return "VERBOSE";
    default: return "UNKNOWN";
    }
}

const char* command_to_str(command_types_t cmd) {
    switch (cmd) {
    case COMMAND_NONE: return "NONE";
    case COMMAND_BOTH_UP: return "BOTH_UP";
    case COMMAND_BOTH_DOWN: return "BOTH_DOWN";
    case COMMAND_BOTH_BLINK: return "BOTH_BLINK";
    case COMMAND_BOTH_BLINK_X2: return "BOTH_BLINK_X2";
    case COMMAND_LEFT_UP: return "LEFT_UP";
    case COMMAND_LEFT_DOWN: return "LEFT_DOWN";
    case COMMAND_LEFT_WINK: return "LEFT_WINK";
    case COMMAND_LEFT_WINK_X2: return "LEFT_WINK_X2";
    case COMMAND_RIGHT_UP: return "RIGHT_UP";
    case COMMAND_RIGHT_DOWN: return "RIGHT_DOWN";
    case COMMAND_RIGHT_WINK: return "RIGHT_WINK";
    case COMMAND_RIGHT_WINK_X2: return "RIGHT_WINK_X2";
    case COMMAND_LEFT_WAVE: return "LEFT_WAVE";
    case COMMAND_RIGHT_WAVE: return "RIGHT_WAVE";
    case COMMAND_LEFT_RIGHT: return "LEFT_RIGHT";
    case COMMAND_LEFT_RIGHT_X2: return "LEFT_RIGHT_X2";
    case COMMAND_RIGHT_LEFT: return "RIGHT_LEFT";
    case COMMAND_RIGHT_LEFT_X2: return "RIGHT_LEFT_X2";
    case COMMAND_SLEEPY_EYE: return "SLEEPY_EYE";
    // case SWAP_ORIENTATION: return "SWAP_ORIENTATION";
    // case RESET_MCU: return "RESET_MCU";
    default: return "UNKNOWN";
    }
}

const char* move_type_to_str(move_type_t type) {
    switch (type) {
    case MOVE_NOP: return "NOP";
    case MOVE_DOWN: return "DOWN";
    case MOVE_UP: return "UP";
    case MOVE_PARTIAL: return "PARTIAL";
    default: return "UNKNOWN";
    }
}

const char* side_to_str(uint8_t side) {
    switch (side) {
    case LEFT_SIDE: return "LEFT";
    case RIGHT_SIDE: return "RIGHT";
    default: return "UNKNOWN";
    }
}

const char* binding_type_to_str(button_bindings_type_t type) {
    switch (type) {
    case BINDING_NONE: return "NONE";
    case BINDING_BUILTIN: return "BUILTIN";
    case BINDING_CUSTOM_SEQUENCE: return "CUSTOM_SEQUENCE";
    case BINDING_SETTING: return "SETTING";
    default: return "UNKNOWN";
    }
}

const char* aux_side_to_str(aux_side_t side) {
    switch (side) {
    case ONE: return "AUX_ONE";
    case TWO: return "AUX_TWO";
    default: return "UNKNOWN";
    }
}

const char* aux_status_to_str(aux_status_t status) {
    switch (status) {
    case AUX_DISABLED: return "DISABLED";
    case AUX_ENABLED: return "ENABLED";
    default: return "UNKNOWN";
    }
}

const char* aux_type_to_str(aux_type_t type) {
    switch (type) {
    case AUX_LATCHING: return "LATCHING";
    case AUX_MOMENTARY: return "MOMENTARY";
    default: return "UNKNOWN";
    }
}

void init_ble_debugger() {
    current_debug_level = BLE_DEBUG_NONE;
    client_subscribed = 0;
    buf_head = 0;
    buf_tail = 0;
    buf_count = 0;
    dropped_logs = 0;

    if (debug_lock == NULL)
        debug_lock = xSemaphoreCreateMutex();
}

void reset_debugger_on_disconnect() {
    if (debug_lock == NULL)
        return;

    xSemaphoreTake(debug_lock, portMAX_DELAY);
    current_debug_level = BLE_DEBUG_NONE;
    client_subscribed = 0;
    buf_head = 0;
    buf_tail = 0;
    buf_count = 0;
    dropped_logs = 0;
    xSemaphoreGive(debug_lock);
}

uint8_t validate_debug_level(const uint8_t* data, size_t size) {
    if (data == NULL)
        return 0;
    if (size != 1)
        return 0;
    if (data[0] > BLE_DEBUG_VERBOSE)
        return 0;

    return 1;
}

void set_debug_level(ble_debug_level_t level) {
    if (level > BLE_DEBUG_VERBOSE || debug_lock == NULL)
        return;

    xSemaphoreTake(debug_lock, portMAX_DELAY);
    uint8_t was_none = (current_debug_level == BLE_DEBUG_NONE);
    if (level == BLE_DEBUG_NONE) {
        buf_head = 0;
        buf_tail = 0;
        buf_count = 0;
        dropped_logs = 0;
    }
    current_debug_level = level;
    xSemaphoreGive(debug_lock);

    if (level == BLE_DEBUG_NONE)
        return;

    BLE_LOGI(TAG, "Debug level set to %s", debug_level_to_str(level));

    if (was_none) {
        headlight_position_t pos = get_position();
        uint8_t sleep_l = 50;
        uint8_t sleep_r = 50;
        get_sleepy_eye_values(&sleep_l, &sleep_r);
        BLE_LOGD(TAG, "State: L=%u%% R=%u%% | Sleepy cfg: L=%u%% R=%u%%", pos.left_pos, pos.right_pos, sleep_l, sleep_r);
        BLE_LOGD(TAG, "Cal: L=%ums R=%ums | Btn: en=%u delay=%ums", get_left_move_time_ms(), get_right_move_time_ms(), get_custom_button_status(), get_custom_button_delay());
    }
}

ble_debug_level_t get_debug_level() {
    return current_debug_level;
}

void set_debug_subscribed(uint8_t subscribed) {
    if (debug_lock == NULL)
        return;

    xSemaphoreTake(debug_lock, portMAX_DELAY);
    client_subscribed = subscribed ? 1 : 0;
    xSemaphoreGive(debug_lock);

    if (subscribed && ble_debug_task_handle != NULL)
        xTaskNotifyGive(ble_debug_task_handle);
}

uint8_t get_debug_subscribed() {
    return client_subscribed;
}

void ble_log(ble_debug_level_t level, const char* tag, const char* fmt, ...) {
    if (level == BLE_DEBUG_NONE || level > current_debug_level)
        return;
    if (get_device_status() != CONNECTED || get_auth_state() != AUTH_ESTABLISHED)
        return;
    if (debug_lock == NULL || fmt == NULL)
        return;

    char line[BLE_DEBUG_MAX_LINE_LEN];
    const char* safe_tag = (tag != NULL) ? tag : "LOG";

    int prefix_len = snprintf(line, sizeof(line), "[%c][%s] ", level_to_char(level), safe_tag);
    if (prefix_len < 0)
        return;
    if ((size_t)prefix_len >= sizeof(line))
        prefix_len = sizeof(line) - 1;

    va_list args;
    va_start(args, fmt);
    int body_len = vsnprintf(line + prefix_len, sizeof(line) - (size_t)prefix_len, fmt, args);
    va_end(args);

    size_t total_len = (size_t)prefix_len + ((body_len > 0) ? (size_t)body_len : 0);
    if (total_len >= (sizeof(line) - 1))
        total_len = sizeof(line) - 2;

    if (total_len == 0 || line[total_len - 1] != '\n') {
        line[total_len] = '\n';
        total_len++;
    }
    line[total_len] = '\0';

    xSemaphoreTake(debug_lock, portMAX_DELAY);
    if (current_debug_level >= level && (BLE_DEBUG_BUF_SIZE - buf_count) >= total_len) {
        for (size_t i = 0; i < total_len; i++) {
            log_ring_buf[buf_head] = line[i];
            buf_head = (buf_head + 1) % BLE_DEBUG_BUF_SIZE;
        }
        buf_count += total_len;
        xSemaphoreGive(debug_lock);

        if (ble_debug_task_handle != NULL)
            xTaskNotifyGive(ble_debug_task_handle);
    } else {
        if (current_debug_level >= level)
            dropped_logs++;
        xSemaphoreGive(debug_lock);
    }
}

void ble_debug_task(void* args) {
    uint8_t chunk[BLE_DEBUG_CHUNK_SIZE];

    for (;;) {
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        for (;;) {
            if (get_device_status() != CONNECTED || get_auth_state() != AUTH_ESTABLISHED)
                break;

            size_t chunk_len = 0;
            uint8_t has_more = 0;

            xSemaphoreTake(debug_lock, portMAX_DELAY);
            if (current_debug_level == BLE_DEBUG_NONE || !client_subscribed || (buf_count == 0 && dropped_logs == 0)) {
                xSemaphoreGive(debug_lock);
                break;
            }

            if (dropped_logs > 0) {
                int drop_len = snprintf((char*)chunk, sizeof(chunk), "[W][%s] Dropped %lu logs (buffer full)\n", TAG, (unsigned long)dropped_logs);
                if (drop_len > 0 && (size_t)drop_len < sizeof(chunk)) {
                    chunk_len = (size_t)drop_len;
                    dropped_logs = 0;
                }
            }

            size_t max_copy = BLE_DEBUG_CHUNK_SIZE - chunk_len;
            if (buf_count < max_copy)
                max_copy = buf_count;

            // copy up to the last complete newline so lines are not split across notifications
            size_t copy_len = 0;
            for (size_t i = 0; i < max_copy; i++) {
                if (log_ring_buf[(buf_tail + i) % BLE_DEBUG_BUF_SIZE] == '\n')
                    copy_len = i + 1;
            }

            if (copy_len == 0 && chunk_len == 0)
                copy_len = max_copy;

            for (size_t i = 0; i < copy_len; i++) {
                chunk[chunk_len++] = (uint8_t)log_ring_buf[buf_tail];
                buf_tail = (buf_tail + 1) % BLE_DEBUG_BUF_SIZE;
            }
            buf_count -= copy_len;
            has_more = (buf_count > 0 || dropped_logs > 0);
            xSemaphoreGive(debug_lock);

            if (chunk_len > 0)
                ble_notify_debug(chunk, chunk_len);

            if (!has_more)
                break;

            vTaskDelay(pdMS_TO_TICKS(BLE_DEBUG_TX_DELAY_MS));
        }
    }
}
