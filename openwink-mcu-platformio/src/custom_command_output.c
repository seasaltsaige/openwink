#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "command_output.h"
#include "custom_command_output.h"

typedef enum {
    COMMAND_IDLE,
    COMMAND_RUNNING,
    COMMAND_STOPPING,// if stopping, no more cancellations should be possible
} custom_command_state_t;

TaskHandle_t custom_command_task_handle;
QueueHandle_t custom_command_queue_handle;
SemaphoreHandle_t custom_mutex_handle;


custom_command_state_t cmd_state = COMMAND_IDLE;

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
    xSemaphoreTake(custom_mutex_handle, portMAX_DELAY);

    // only allow cancellation if a command is actually running
    if (cmd_state == COMMAND_RUNNING) {
        cmd_state = COMMAND_STOPPING;
        // send cancellation
        xTaskNotify(custom_command_task_handle, NOTIFY_BUTTON_INTERRUPT_BIT, eSetBits);
    }

    xSemaphoreGive(custom_mutex_handle);
}

/**
 * @param delay Delay to wait for completion, 0 delay waits indefinitely
 * @return 1 if sequence cancellation occurred, 0 otherwise
 */
static uint8_t wait_for_command_completion(uint16_t delay) {
    uint8_t is_delay = delay != 0;
    uint32_t bits = NOTIFY_BUTTON_INTERRUPT_BIT | NOTIFY_COMMAND_DONE_BIT;

    uint8_t cancelled = 0;
    TickType_t remaining = pdMS_TO_TICKS(delay);
    TimeOut_t timeout;

    if (is_delay)
        vTaskSetTimeOutState(&timeout);

    for (;;) {
        uint32_t events;

        BaseType_t received = xTaskNotifyWait(0, bits, &events, is_delay ? remaining : portMAX_DELAY);

        if (received == pdTRUE) {
            if ((events & NOTIFY_BUTTON_INTERRUPT_BIT) != 0) {
                cancelled = 1;
                // if we are waiting for a delay, but it
                // got cancelled, dont need to wait for command completion (there shouldnt be one)
                // so just return
                if (is_delay)
                    return cancelled;
            }

            // not delay, and command has finished
            if (!is_delay && ((events & NOTIFY_COMMAND_DONE_BIT) != 0))
                return cancelled;
        }

        // delay finished normally and timed out
        if (is_delay && xTaskCheckForTimeOut(&timeout, &remaining) != pdFALSE) {
            return 0;
        }
    }
}


void init_custom_command_queue() {
    custom_command_queue_handle = xQueueCreate(1, sizeof(custom_command_data_t));
    // shhh
    custom_mutex_handle = xSemaphoreCreateMutex();
}

uint8_t get_custom_command_executing() {
    return cmd_state == COMMAND_RUNNING;
}

void custom_command_task() {
    custom_command_data_t cmd_data;
    for (;;) {
        if (xQueueReceive(custom_command_queue_handle, &cmd_data, portMAX_DELAY)) {
            // loop through each value of the cmd
            // sequence_index will be equal to i until a delay is encountered (3 bytes vs 1 byte)
            uint8_t sequence_index = 0;
            uint8_t sequence_cancelled = 0;

            for (uint8_t i = 0; i < cmd_data.sequence_length; i++) {

                if (cmd_data.sequence[sequence_index] == DELAY_PREFIX) {
                    // Handle delay (Little Endian -- 0xDEEE02 yields Delay 0x02EE or Delay 750ms)
                    uint16_t delay = (cmd_data.sequence[sequence_index + 1] << 0) | (cmd_data.sequence[sequence_index + 2] << 8);

                    sequence_cancelled = wait_for_command_completion(delay);
                    sequence_index += 3;
                } else {
                    // Send regular cmd
                    command_t cmd = cmd_data.sequence[sequence_index];
                    xQueueSend(command_output_queue, &cmd, portMAX_DELAY);

                    sequence_cancelled = wait_for_command_completion(0);
                    sequence_index += 1;
                }

                if (sequence_cancelled) {
                    break;
                }
            }


            // clean up after either cancellation or command completion (reset state)
            xSemaphoreTake(custom_mutex_handle, portMAX_DELAY);

            // if we get a cancel or state is already stopping, command was interrupted
            uint8_t was_cancelled = sequence_cancelled || cmd_state == COMMAND_STOPPING;

            // cleanup leftover notify from before mutex is aquired
            uint32_t _;
            xTaskNotifyWait(0, NOTIFY_BUTTON_INTERRUPT_BIT, &_, 0);

            if (was_cancelled)
                xQueueReset(custom_command_queue_handle);

            cmd_state = COMMAND_IDLE;
            xSemaphoreGive(custom_mutex_handle);
        }
    }
}