#include <FreeRTOSConfig.h>
#include <esp_log_level.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>


#include "ble/debugger/ble_debugger.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "output_handler.h"

static const char* TAG = "SEQ";

typedef enum {
    COMMAND_IDLE,
    COMMAND_RUNNING,
    COMMAND_STOPPING,// if stopping, no more cancellations should be possible
} custom_command_state_t;

TaskHandle_t custom_command_task_handle;
QueueHandle_t custom_command_queue_handle;
SemaphoreHandle_t custom_mutex_handle;


custom_command_state_t cmd_state = COMMAND_IDLE;
static volatile command_types_t next_custom_cmd = COMMAND_NONE;

BaseType_t request_command_submission(custom_command_data_t* cmd) {
    BaseType_t ret = pdFAIL;

    xSemaphoreTake(custom_mutex_handle, portMAX_DELAY);

    // only allow command sending if handler is idle
    if (cmd_state == COMMAND_IDLE) {
        cmd_state = COMMAND_RUNNING;

        // send cmd to queue
        ret = xQueueSend(custom_command_queue_handle, cmd, 0);

        // if queue is full or just fails, return to idle
        if (ret != pdPASS)
            cmd_state = COMMAND_IDLE;
    }

    xSemaphoreGive(custom_mutex_handle);

    return ret;
}


void request_command_cancellation() {
    if (custom_mutex_handle == NULL)
        return;

    xSemaphoreTake(custom_mutex_handle, portMAX_DELAY);

    // allow cancellation whenever a command is active
    if (cmd_state != COMMAND_IDLE) {
        cmd_state = COMMAND_STOPPING;
        if (custom_command_task_handle != NULL)
            xTaskNotify(custom_command_task_handle, NOTIFY_BUTTON_INTERRUPT_BIT, eSetBits);
        BLE_LOGW(TAG, "Sequence cancellation requested");
    }

    xSemaphoreGive(custom_mutex_handle);
}

/**
 * @param delay Delay to wait for completion, 0 delay waits indefinitely
 * @return 1 if sequence cancellation occurred, 0 otherwise
 */
static uint8_t wait_for_command_completion(uint16_t delay) {
    uint8_t is_delay = delay != 0;
    uint32_t bits = is_delay ? NOTIFY_BUTTON_INTERRUPT_BIT : (NOTIFY_BUTTON_INTERRUPT_BIT | NOTIFY_COMMAND_DONE_BIT);

    uint8_t cancelled = (cmd_state == COMMAND_STOPPING) ? 1 : 0;
    TickType_t remaining = pdMS_TO_TICKS(delay);
    TimeOut_t timeout;

    if (is_delay)
        vTaskSetTimeOutState(&timeout);

    for (;;) {
        uint32_t events = 0;
        TickType_t wait_ticks = is_delay ? remaining : (cancelled ? pdMS_TO_TICKS(50) : portMAX_DELAY);

        BaseType_t received = xTaskNotifyWait(0, bits, &events, wait_ticks);

        if (received == pdTRUE) {
            if ((events & NOTIFY_BUTTON_INTERRUPT_BIT) != 0) {
                cancelled = 1;
                if (is_delay)
                    return cancelled;
            }

            // not delay, and command has finished
            if (!is_delay && ((events & NOTIFY_COMMAND_DONE_BIT) != 0))
                return cancelled;
        }

        if (!is_delay && cancelled && !get_command_busy() && uxQueueMessagesWaiting(command_output_queue) == 0) {
            return cancelled;
        }

        // delay finished normally and timed out
        if (is_delay && xTaskCheckForTimeOut(&timeout, &remaining) != pdFALSE) {
            return cancelled;
        }
    }
}


void init_custom_command_queue() {
    custom_command_queue_handle = xQueueCreate(1, sizeof(custom_command_data_t));
    // shhh
    custom_mutex_handle = xSemaphoreCreateMutex();
}

uint8_t get_custom_command_executing() {
    return cmd_state != COMMAND_IDLE;
}

command_types_t peek_next_custom_command() {
    if (cmd_state != COMMAND_RUNNING)
        return COMMAND_NONE;
    return next_custom_cmd;
}


uint8_t validate_custom_command(custom_command_data_t* cmd, size_t received_size) {
    if (cmd == NULL)
        return 0;

    // max and min size checks
    if (received_size <= CUSTOM_CMD_HEADER_LENGTH || received_size > (CUSTOM_CMD_HEADER_LENGTH + PAYLOAD_MAX)) {
        BLE_LOGD(TAG, "Invalid custom cmd size: %u", (unsigned int)received_size);
        return 0;
    }


    if (cmd->looping != 0 && cmd->looping != 1) {
        BLE_LOGD(TAG, "Invalid looping flag: %u", cmd->looping);
        return 0;
    }

    size_t payload_bytes = received_size - CUSTOM_CMD_HEADER_LENGTH;
    if (cmd->sequence_length == 0 || cmd->sequence_length > payload_bytes || cmd->sequence_length > MAX_SEQUENCE_LENGTH) {
        BLE_LOGD(TAG, "Invalid seq length: %u (payload=%u)", cmd->sequence_length, (unsigned int)payload_bytes);
        return 0;
    }

    size_t sequence_index = 0;
    for (uint8_t i = 0; i < cmd->sequence_length; i++) {
        if (sequence_index >= payload_bytes) {
            BLE_LOGD(TAG, "Seq ended early at step %u", i);
            return 0;
        }

        uint8_t current = cmd->sequence[sequence_index];

        if (current == DELAY_PREFIX) {
            // delays require 3 bytes total
            if ((sequence_index + 2) >= payload_bytes) {
                BLE_LOGD(TAG, "Truncated delay at step %u", i);
                return 0;
            }

            uint16_t delay = (cmd->sequence[sequence_index + 1] << 0) | (cmd->sequence[sequence_index + 2] << 8);

            if (delay == 0) {
                BLE_LOGD(TAG, "Zero delay at step %u", i);
                return 0;
            }

            sequence_index += 3;
        } else if (current >= COMMAND_BOTH_UP && current <= COMMAND_SLEEPY_EYE) {
            sequence_index += 1;
        } else {
            // Unknown command byte
            BLE_LOGD(TAG, "Unknown cmd byte 0x%02X at step %u", current, i);
            return 0;
        }
    }

    if (sequence_index != payload_bytes) {
        BLE_LOGD(TAG, "Payload length mismatch: parsed %u vs %u", (unsigned int)sequence_index, (unsigned int)payload_bytes);
        return 0;
    }

    return 1;
}

void custom_command_task(void* args) {
    custom_command_data_t cmd_data;
    for (;;) {
        if (xQueueReceive(custom_command_queue_handle, &cmd_data, portMAX_DELAY)) {
            set_command_busy(1);

            // clear stale notifs
            uint32_t _;
            xTaskNotifyWait(0, NOTIFY_BUTTON_INTERRUPT_BIT | NOTIFY_COMMAND_DONE_BIT, &_, 0);

            uint8_t was_sleepy = is_left_sleepy() || is_right_sleepy();
            uint8_t left_origin = POSITION_DOWN;
            uint8_t right_origin = POSITION_DOWN;
            uint8_t sequence_cancelled = (cmd_state == COMMAND_STOPPING) ? 1 : 0;

            BLE_LOGI(TAG, "Sequence start (steps=%u, loop=%u, sleepy=%u)", cmd_data.sequence_length, cmd_data.looping, was_sleepy);

            if (was_sleepy && !sequence_cancelled) {
                headlight_position_t init_pos = get_position();
                left_origin = is_left_sleepy() ? (init_pos.last_left_move_dir == MOVE_UP ? POSITION_DOWN : POSITION_UP) : init_pos.left_pos;
                right_origin = is_right_sleepy() ? (init_pos.last_right_move_dir == MOVE_UP ? POSITION_DOWN : POSITION_UP) : init_pos.right_pos;

                command_t exit_cmd = COMMAND_SLEEPY_EYE;
                xQueueSend(command_output_queue, &exit_cmd, portMAX_DELAY);
                sequence_cancelled = wait_for_command_completion(0);
            }

            // loop through each value of the cmd
            // sequence_index will be equal to i until a delay is encountered (3 bytes vs 1 byte)
            size_t sequence_index = 0;

            for (int8_t i = 0; !sequence_cancelled && cmd_state == COMMAND_RUNNING && i < cmd_data.sequence_length; i++) {

                if (cmd_data.sequence[sequence_index] == DELAY_PREFIX) {
                    next_custom_cmd = COMMAND_NONE;
                    // Handle delay (Little Endian -- 0xDEEE02 yields Delay 0x02EE or Delay 750ms)
                    uint16_t delay = (cmd_data.sequence[sequence_index + 1] << 0) | (cmd_data.sequence[sequence_index + 2] << 8);

                    BLE_LOGD(TAG, "Step %d/%u: DELAY %ums", i + 1, cmd_data.sequence_length, delay);
                    sequence_cancelled = wait_for_command_completion(delay);
                    sequence_index += 3;
                } else {
                    // Send regular cmd
                    command_t cmd = cmd_data.sequence[sequence_index];
                    uint8_t next_raw = COMMAND_NONE;
                    if ((i + 1) < cmd_data.sequence_length)
                        next_raw = cmd_data.sequence[sequence_index + 1];
                    else if (cmd_data.looping)
                        next_raw = cmd_data.sequence[0];

                    next_custom_cmd = (next_raw >= COMMAND_BOTH_UP && next_raw <= COMMAND_SLEEPY_EYE) ? (command_types_t)next_raw : COMMAND_NONE;

                    // Clear any stale NOTIFY_COMMAND_DONE_BIT before queueing step
                    xTaskNotifyWait(0, NOTIFY_COMMAND_DONE_BIT, &_, 0);

                    BLE_LOGD(TAG, "Step %d/%u: %s", i + 1, cmd_data.sequence_length, command_to_str((command_types_t)cmd));
                    xQueueSend(command_output_queue, &cmd, portMAX_DELAY);

                    sequence_cancelled = wait_for_command_completion(0);
                    next_custom_cmd = COMMAND_NONE;
                    sequence_index += 1;
                }

                if (sequence_cancelled || cmd_state != COMMAND_RUNNING)
                    break;

                // loop forever if looping is enabled
                if ((i == (cmd_data.sequence_length - 1)) && cmd_data.looping) {
                    BLE_LOGV(TAG, "Sequence loop restart");
                    i = -1;
                    sequence_index = 0;
                    continue;
                }
            }

            if (was_sleepy && !sequence_cancelled && cmd_state != COMMAND_STOPPING && !cmd_data.looping) {
                if (!is_left_sleepy() && !is_right_sleepy()) {
                    BLE_LOGD(TAG, "Sequence restoring sleepy (orig L=%u%% R=%u%%)", left_origin, right_origin);
                    headlight_position_t end_pos = get_position();

                    if (left_origin == right_origin && (end_pos.left_pos != left_origin || end_pos.right_pos != right_origin)) {
                        command_t sync_cmd = (left_origin == POSITION_UP) ? COMMAND_BOTH_UP : COMMAND_BOTH_DOWN;
                        xQueueSend(command_output_queue, &sync_cmd, portMAX_DELAY);
                        sequence_cancelled = wait_for_command_completion(0);
                    } else {
                        if (end_pos.left_pos != left_origin) {
                            command_t left_cmd = (left_origin == POSITION_UP) ? COMMAND_LEFT_UP : COMMAND_LEFT_DOWN;
                            xQueueSend(command_output_queue, &left_cmd, portMAX_DELAY);
                            sequence_cancelled = wait_for_command_completion(0);
                        }
                        if (!sequence_cancelled && cmd_state != COMMAND_STOPPING && end_pos.right_pos != right_origin) {
                            command_t right_cmd = (right_origin == POSITION_UP) ? COMMAND_RIGHT_UP : COMMAND_RIGHT_DOWN;
                            xQueueSend(command_output_queue, &right_cmd, portMAX_DELAY);
                            sequence_cancelled = wait_for_command_completion(0);
                        }
                    }

                    if (!sequence_cancelled && cmd_state != COMMAND_STOPPING) {
                        command_t enter_cmd = COMMAND_SLEEPY_EYE;
                        xQueueSend(command_output_queue, &enter_cmd, portMAX_DELAY);
                        sequence_cancelled = wait_for_command_completion(0);
                    }
                }
            }

            // clean up after either cancellation or command completion (reset state)
            xSemaphoreTake(custom_mutex_handle, portMAX_DELAY);

            // if we get a cancel or state is already stopping, command was interrupted
            uint8_t was_cancelled = sequence_cancelled || cmd_state == COMMAND_STOPPING;

            // cleanup leftover notify from before mutex is aquired
            xTaskNotifyWait(0, NOTIFY_BUTTON_INTERRUPT_BIT, &_, 0);

            if (was_cancelled)
                xQueueReset(custom_command_queue_handle);

            cmd_state = COMMAND_IDLE;
            xSemaphoreGive(custom_mutex_handle);

            if (uxQueueMessagesWaiting(command_output_queue) == 0)
                set_command_busy(0);

            BLE_LOGI(TAG, "Sequence ended (%s)", was_cancelled ? "CANCELLED" : "COMPLETE");
        }
    }
}