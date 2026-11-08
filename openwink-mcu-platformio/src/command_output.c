#include <FreeRTOSConfig.h>
#include <esp_sleep.h>
#include <freertos/FreeRTOS.h>
#include <stdbool.h>

#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"
#include "storage_handler.h"

static const char* TAG = "CMD";

QueueHandle_t command_output_queue;
TaskHandle_t command_output_task;

RTC_DATA_ATTR command_state_data_t cmd_data = {
    .busy = 0,
    .wave_delay = 50,
};

void init_command_queue() {
    command_output_queue = xQueueCreate(20, sizeof(command_types_t));
    cmd_data.busy = 0;
    // shhh dont look at this (this is definitely initializing the queue)
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED)
        get_nvs_wave_delay(&cmd_data.wave_delay);
}

// TODO: Add helper function similar to custom command to request submisison?
// maybe to abstract away the queue... not sure


// helpers for queuing commands internally
static void queue_side_move(uint8_t side, move_type_t type, uint8_t is_final) {
    movement_target_t move = {
        .target = type,
        .target_pos = 0,
        .final_move = is_final,
    };
    if (side == LEFT_SIDE)
        xQueueSend(left_output_queue, &move, portMAX_DELAY);
    else if (side == RIGHT_SIDE)
        xQueueSend(right_output_queue, &move, portMAX_DELAY);
}

static void queue_side_partial_move(uint8_t side, uint8_t target_pos, uint8_t is_final) {
    movement_target_t move = {
        .target = MOVE_PARTIAL,
        .target_pos = target_pos,
        .final_move = is_final,
    };
    if (side == LEFT_SIDE)
        xQueueSend(left_output_queue, &move, portMAX_DELAY);
    else if (side == RIGHT_SIDE)
        xQueueSend(right_output_queue, &move, portMAX_DELAY);
}

static void queue_side_wink(uint8_t side, uint8_t is_final) {
    headlight_position_t pos = get_position();
    uint8_t curr_pos = (side == LEFT_SIDE) ? pos.left_pos : pos.right_pos;
    move_type_t last_dir = (side == LEFT_SIDE) ? pos.last_left_move_dir : pos.last_right_move_dir;
    uint8_t sleepy = (side == LEFT_SIDE) ? is_left_sleepy() : is_right_sleepy();

    BLE_LOGD(TAG, "%s wink (sleepy=%u, pos=%u%%, last=%s)", side_to_str(side), sleepy, curr_pos, move_type_to_str(last_dir));

    if (!sleepy) {
        queue_side_move(side, curr_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
        queue_side_move(side, curr_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, is_final);
    } else {
        move_type_t cont_dir = (last_dir == MOVE_UP) ? MOVE_UP : MOVE_DOWN;
        move_type_t opp_dir = (cont_dir == MOVE_UP) ? MOVE_DOWN : MOVE_UP;
        queue_side_move(side, cont_dir, false);
        queue_side_move(side, opp_dir, false);
        queue_side_partial_move(side, curr_pos, is_final);
    }
}

static void exit_sleepy_to_origin() {
    headlight_position_t pos = get_position();
    uint8_t left_sleepy = is_left_sleepy();
    uint8_t right_sleepy = is_right_sleepy();

    if (!left_sleepy && !right_sleepy)
        return;

    move_type_t left_finish = left_sleepy ? (pos.last_left_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;
    move_type_t right_finish = right_sleepy ? (pos.last_right_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;

    move_type_t left_reverse = left_sleepy ? (left_finish == MOVE_UP ? MOVE_DOWN : MOVE_UP) : MOVE_NOP;
    move_type_t right_reverse = right_sleepy ? (right_finish == MOVE_UP ? MOVE_DOWN : MOVE_UP) : MOVE_NOP;

    BLE_LOGI(TAG, "Exiting sleepy eye (L=%s->%s, R=%s->%s)", move_type_to_str(left_finish), move_type_to_str(left_reverse), move_type_to_str(right_finish), move_type_to_str(right_reverse));

    // finish current movement (up/down)
    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    queue_side_move(LEFT_SIDE, left_finish, false);
    queue_side_move(RIGHT_SIDE, right_finish, false);
    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

    // move completely in the opposite direction back to original position
    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    queue_side_move(LEFT_SIDE, left_reverse, false);
    queue_side_move(RIGHT_SIDE, right_reverse, false);
    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
}

static void sync_sides_before_sequence(uint8_t primary_side, headlight_position_t* saved_pos, uint8_t* was_sleepy) {
    *saved_pos = get_position();
    uint8_t left_sleepy = is_left_sleepy();
    uint8_t right_sleepy = is_right_sleepy();
    *was_sleepy = (left_sleepy || right_sleepy);

    uint8_t left_origin = left_sleepy ? (saved_pos->last_left_move_dir == MOVE_UP ? POSITION_DOWN : POSITION_UP) : saved_pos->left_pos;
    uint8_t right_origin = right_sleepy ? (saved_pos->last_right_move_dir == MOVE_UP ? POSITION_DOWN : POSITION_UP) : saved_pos->right_pos;
    uint8_t target_pos = (primary_side == LEFT_SIDE) ? left_origin : right_origin;
    move_type_t sync_dir = (target_pos == POSITION_UP) ? MOVE_UP : MOVE_DOWN;

    BLE_LOGD(TAG, "Pre-sync (%s primary) -> target %u%% (sleepy=%u)", side_to_str(primary_side), target_pos, *was_sleepy);

    if (*was_sleepy) {
        move_type_t left_finish = left_sleepy ? (saved_pos->last_left_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;
        move_type_t right_finish = right_sleepy ? (saved_pos->last_right_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;

        xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
        queue_side_move(LEFT_SIDE, left_finish, false);
        queue_side_move(RIGHT_SIDE, right_finish, false);
        xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
    }

    headlight_position_t curr = get_position();
    if (curr.left_pos != target_pos || curr.right_pos != target_pos) {
        xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
        queue_side_move(LEFT_SIDE, sync_dir, false);
        queue_side_move(RIGHT_SIDE, sync_dir, false);
        xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
    }
}

static void restore_sleepy_after_sequence(const headlight_position_t* saved_pos, uint8_t was_sleepy) {
    if (!was_sleepy)
        return;

    BLE_LOGD(TAG, "Restore sleepy -> L=%u%% R=%u%%", saved_pos->left_pos, saved_pos->right_pos);

    uint8_t left_was_sleepy = (saved_pos->left_pos != POSITION_DOWN && saved_pos->left_pos != POSITION_UP);
    uint8_t right_was_sleepy = (saved_pos->right_pos != POSITION_DOWN && saved_pos->right_pos != POSITION_UP);

    uint8_t left_origin = left_was_sleepy ? (saved_pos->last_left_move_dir == MOVE_UP ? POSITION_DOWN : POSITION_UP) : saved_pos->left_pos;
    uint8_t right_origin = right_was_sleepy ? (saved_pos->last_right_move_dir == MOVE_UP ? POSITION_DOWN : POSITION_UP) : saved_pos->right_pos;

    headlight_position_t curr = get_position();
    if (curr.left_pos != left_origin || curr.right_pos != right_origin) {
        move_type_t left_dir = (curr.left_pos != left_origin) ? (left_origin == POSITION_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;
        move_type_t right_dir = (curr.right_pos != right_origin) ? (right_origin == POSITION_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;

        xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
        queue_side_move(LEFT_SIDE, left_dir, false);
        queue_side_move(RIGHT_SIDE, right_dir, false);
        xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
    }

    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    if (left_was_sleepy)
        queue_side_partial_move(LEFT_SIDE, saved_pos->left_pos, false);
    else
        queue_side_move(LEFT_SIDE, MOVE_NOP, false);

    if (right_was_sleepy)
        queue_side_partial_move(RIGHT_SIDE, saved_pos->right_pos, false);
    else
        queue_side_move(RIGHT_SIDE, MOVE_NOP, false);

    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
}

static void both_swap() {
    headlight_position_t pos = get_position();
    move_type_t left_dir = (pos.left_pos == POSITION_UP) ? MOVE_DOWN : MOVE_UP;
    move_type_t right_dir = (pos.right_pos == POSITION_UP) ? MOVE_DOWN : MOVE_UP;

    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
    queue_side_move(LEFT_SIDE, left_dir, false);
    queue_side_move(RIGHT_SIDE, right_dir, false);
    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
}

static void run_left_right_sequence(uint8_t primary_side, uint8_t swap_pairs) {
    headlight_position_t saved_pos = get_position();
    uint8_t left_sleepy = is_left_sleepy();
    uint8_t right_sleepy = is_right_sleepy();
    uint8_t was_sleepy = (left_sleepy || right_sleepy);

    if (was_sleepy) {
        move_type_t left_finish = left_sleepy ? (saved_pos.last_left_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;
        move_type_t right_finish = right_sleepy ? (saved_pos.last_right_move_dir == MOVE_UP ? MOVE_UP : MOVE_DOWN) : MOVE_NOP;

        xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
        queue_side_move(LEFT_SIDE, left_finish, false);
        queue_side_move(RIGHT_SIDE, right_finish, false);
        xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
    }

    headlight_position_t curr_pos = get_position();
    uint8_t started_matched = (curr_pos.left_pos == curr_pos.right_pos);
    EventBits_t primary_bit = (primary_side == LEFT_SIDE) ? LEFT_COMPLETE_BIT : RIGHT_COMPLETE_BIT;
    uint8_t primary_origin = (primary_side == LEFT_SIDE) ? curr_pos.left_pos : curr_pos.right_pos;

    if (started_matched) {
        move_type_t offset_dir = (primary_origin == POSITION_UP) ? MOVE_DOWN : MOVE_UP;
        xEventGroupClearBits(output_event_group, primary_bit);
        queue_side_move(primary_side, offset_dir, false);
        xEventGroupWaitBits(output_event_group, primary_bit, pdFALSE, pdTRUE, portMAX_DELAY);
    }

    uint8_t total_swaps = swap_pairs * 2;
    for (uint8_t i = 0; i < total_swaps; i++)
        both_swap();

    if (started_matched) {
        move_type_t return_dir = (primary_origin == POSITION_UP) ? MOVE_UP : MOVE_DOWN;
        xEventGroupClearBits(output_event_group, primary_bit);
        queue_side_move(primary_side, return_dir, false);
        xEventGroupWaitBits(output_event_group, primary_bit, pdFALSE, pdTRUE, portMAX_DELAY);
    }

    restore_sleepy_after_sequence(&saved_pos, was_sleepy);
}

void set_wave_delay(uint8_t delay) {
    if (delay > 100) {
        BLE_LOGE(TAG, "Wave delay over MAX allowed of %d. Received: %d", WAVE_DELAY_MAX, delay);
        return;
    }
    cmd_data.wave_delay = delay;
    BLE_LOGI(TAG, "Wave delay set to %d", delay);
    set_nvs_wave_delay(delay);
}

void set_command_busy(uint8_t busy) {
    uint8_t normalized = busy ? 1 : 0;
    if (cmd_data.busy != normalized) {
        cmd_data.busy = normalized;
        ble_notify_headlight_status();
    }
}

uint8_t get_command_busy() {
    return cmd_data.busy;
}

static BaseType_t peek_next_command(command_types_t* out_cmd) {
    if (xQueuePeek(command_output_queue, out_cmd, 0) == pdTRUE)
        return pdTRUE;

    if (get_custom_command_executing()) {
        command_types_t next_custom = peek_next_custom_command();
        if (next_custom != COMMAND_NONE) {
            *out_cmd = next_custom;
            return pdTRUE;
        }
    }

    return pdFALSE;
}

// note: portMAX_DELAY might be a bad idea in general, but for now its ok while porting over
void handle_command_task(void* args) {

    command_types_t received;
    command_types_t active_wave_chain = COMMAND_NONE;
    headlight_position_t chain_saved_pos = { 0 };
    uint8_t chain_was_sleepy = 0;

    for (;;) {
        if (xQueueReceive(command_output_queue, &received, portMAX_DELAY)) {
            set_command_busy(1);

            if (active_wave_chain != COMMAND_NONE && received != active_wave_chain) {
                active_wave_chain = COMMAND_NONE;
                chain_was_sleepy = 0;
            }

            headlight_position_t curr_pos = get_position();
            command_types_t peek;
            BaseType_t peeked;

            BLE_LOGI(TAG, "Exec %s (L=%u%% R=%u%%)", command_to_str(received), curr_pos.left_pos, curr_pos.right_pos);

            switch (received) {
            // Both together
            case COMMAND_BOTH_UP:
                curr_pos = get_position();
                if ((is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_DOWN) || (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_DOWN)) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_DOWN) ? MOVE_DOWN : MOVE_NOP, false);
                    queue_side_move(RIGHT_SIDE, (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_DOWN) ? MOVE_DOWN : MOVE_NOP, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }

                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);

                break;
            case COMMAND_BOTH_DOWN:
                curr_pos = get_position();
                if ((is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_UP) || (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_UP)) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_UP) ? MOVE_UP : MOVE_NOP, false);
                    queue_side_move(RIGHT_SIDE, (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_UP) ? MOVE_UP : MOVE_NOP, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }

                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_BOTH_BLINK:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                queue_side_wink(LEFT_SIDE, true);
                queue_side_wink(RIGHT_SIDE, true);

                // wait for both sides to finish their final movement
                ulTaskNotifyTake(pdFALSE, portMAX_DELAY);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case COMMAND_BOTH_BLINK_X2:
                for (uint8_t i = 0; i < 2; i++) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);

                    queue_side_wink(LEFT_SIDE, true);
                    queue_side_wink(RIGHT_SIDE, true);

                    // wait for both sides to finish their final movement
                    ulTaskNotifyTake(pdFALSE, portMAX_DELAY);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                }
                break;
            // Left Only
            case COMMAND_LEFT_UP:
                curr_pos = get_position();
                if (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_DOWN) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_LEFT_DOWN:
                curr_pos = get_position();
                if (is_left_sleepy() && curr_pos.last_left_move_dir == MOVE_UP) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                    queue_side_move(LEFT_SIDE, MOVE_UP, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_move(LEFT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_LEFT_WINK:
                xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                queue_side_wink(LEFT_SIDE, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case COMMAND_LEFT_WINK_X2:
                for (uint8_t i = 0; i < 2; i++) {
                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT);
                    queue_side_wink(LEFT_SIDE, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                }
                break;

            // Right Only
            case COMMAND_RIGHT_UP:
                curr_pos = get_position();
                if (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_DOWN) {
                    xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                    queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                    xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_RIGHT_DOWN:
                curr_pos = get_position();
                if (is_right_sleepy() && curr_pos.last_right_move_dir == MOVE_UP) {
                    xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                    queue_side_move(RIGHT_SIDE, MOVE_UP, false);
                    xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_move(RIGHT_SIDE, MOVE_DOWN, false);
                xEventGroupWaitBits(output_event_group, RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                break;

            case COMMAND_RIGHT_WINK:
                xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                queue_side_wink(RIGHT_SIDE, true);
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                break;
            case COMMAND_RIGHT_WINK_X2:
                for (uint8_t i = 0; i < 2; i++) {
                    xEventGroupClearBits(output_event_group, RIGHT_COMPLETE_BIT);
                    queue_side_wink(RIGHT_SIDE, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                }
                break;
            case COMMAND_LEFT_WAVE:
                if (active_wave_chain != COMMAND_LEFT_WAVE)
                    sync_sides_before_sequence(LEFT_SIDE, &chain_saved_pos, &chain_was_sleepy);
                curr_pos = get_position();

                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                // Temp testing time to test wave
                vTaskDelay(pdMS_TO_TICKS((uint32_t)((float)get_left_move_time_ms() * ((float)cmd_data.wave_delay / 100.0f))));
                queue_side_move(RIGHT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.left_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, false);

                // Wait for the leading side (LEFT) to finish its full wink
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                peeked = peek_next_command(&peek);
                if (peeked == pdTRUE && peek == COMMAND_LEFT_WAVE) {
                    active_wave_chain = COMMAND_LEFT_WAVE;
                } else {
                    queue_side_move(RIGHT_SIDE, MOVE_NOP, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                    restore_sleepy_after_sequence(&chain_saved_pos, chain_was_sleepy);
                    active_wave_chain = COMMAND_NONE;
                    chain_was_sleepy = 0;
                }

                break;
            case COMMAND_RIGHT_WAVE:
                if (active_wave_chain != COMMAND_RIGHT_WAVE)
                    sync_sides_before_sequence(RIGHT_SIDE, &chain_saved_pos, &chain_was_sleepy);
                curr_pos = get_position();

                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(RIGHT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, true);
                // Temp testing time to test wave
                vTaskDelay(pdMS_TO_TICKS((uint32_t)((float)get_right_move_time_ms() * ((float)cmd_data.wave_delay / 100.0f))));
                queue_side_move(LEFT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_DOWN : MOVE_UP, false);
                queue_side_move(LEFT_SIDE, curr_pos.right_pos == POSITION_UP ? MOVE_UP : MOVE_DOWN, false);

                // Wait for the leading side (RIGHT) to finish its full wink
                ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

                peeked = peek_next_command(&peek);
                if (peeked == pdTRUE && peek == COMMAND_RIGHT_WAVE) {
                    active_wave_chain = COMMAND_RIGHT_WAVE;
                } else {
                    queue_side_move(LEFT_SIDE, MOVE_NOP, true);
                    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
                    restore_sleepy_after_sequence(&chain_saved_pos, chain_was_sleepy);
                    active_wave_chain = COMMAND_NONE;
                    chain_was_sleepy = 0;
                }

                break;
            case COMMAND_LEFT_RIGHT:
                run_left_right_sequence(LEFT_SIDE, 1);
                break;
            case COMMAND_LEFT_RIGHT_X2:
                run_left_right_sequence(LEFT_SIDE, 2);
                break;
            case COMMAND_RIGHT_LEFT:
                run_left_right_sequence(RIGHT_SIDE, 1);
                break;
            case COMMAND_RIGHT_LEFT_X2:
                run_left_right_sequence(RIGHT_SIDE, 2);
                break;
            case COMMAND_SLEEPY_EYE:
                if (is_left_sleepy() || is_right_sleepy()) {
                    exit_sleepy_to_origin();
                } else {
                    uint8_t left_val = 50;
                    uint8_t right_val = 50;
                    get_sleepy_eye_values(&left_val, &right_val);

                    BLE_LOGI(TAG, "Entering sleepy eye -> L=%u%% R=%u%%", left_val, right_val);

                    xEventGroupClearBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT);
                    queue_side_partial_move(LEFT_SIDE, left_val, false);
                    queue_side_partial_move(RIGHT_SIDE, right_val, false);
                    xEventGroupWaitBits(output_event_group, LEFT_COMPLETE_BIT | RIGHT_COMPLETE_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
                }
                break;

            default: break;
            }

            curr_pos = get_position();
            BLE_LOGD(TAG, "Done %s (L=%u%% R=%u%%)", command_to_str(received), curr_pos.left_pos, curr_pos.right_pos);

            if (get_custom_command_executing())
                xTaskNotify(custom_command_task_handle, NOTIFY_COMMAND_DONE_BIT, eSetBits);
            else if (uxQueueMessagesWaiting(command_output_queue) == 0)
                set_command_busy(0);
        }
    }
}
