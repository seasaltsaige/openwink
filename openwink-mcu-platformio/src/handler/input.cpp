#include "handler/input.h"
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>


QueueHandle_t button_queue = xQueueCreate(25, sizeof(ButtonEvent));


void MovementHandler::init()
{
    left_moving = false;
    right_moving = false;
    left_move_start_time = 0;
    right_move_start_time = 0;
}

void MovementHandler::poll_left(LEVEL left_state)
{
    if (!left_moving && left_state == HIGH)
    {
        left_moving = true;
        left_move_start_time = esp_timer_get_time();
        return;
    }

    if (left_moving && left_state == LOW)
    {
        int64_t current_time = esp_timer_get_time();
        // Ignore in the first time to allow for signal stabilization
        if ((current_time - left_move_start_time) < MOVEMENT_DEBOUNCE_US)
            return;

        // Update settings
        if (!right_moving)
            update_settings();
        // Reset
        left_moving = false;
        left_move_start_time = 0;
    }
}

void MovementHandler::poll_right(LEVEL right_state)
{

    if (!right_moving && right_state == HIGH)
    {
        right_moving = true;
        right_move_start_time = esp_timer_get_time();
        return;
    }

    if (right_moving && right_state == LOW)
    {
        int64_t current_time = esp_timer_get_time();
        if ((current_time - right_move_start_time) < MOVEMENT_DEBOUNCE_US)
            return;

        if (!left_moving)
            update_settings();

        right_moving = 0;
        right_move_start_time = 0;
    }
}


void MovementHandler::update_settings()
{
    int64_t current_time = esp_timer_get_time();
    Settings::left_move_time = (current_time - left_move_start_time);
    Settings::right_move_time = (current_time - right_move_start_time);

    // TODO: Probably notify BLE characteristic here as well
}