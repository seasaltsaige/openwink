#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <esp_sleep.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>

#include "aux_input.h"
#include "ble/ble_handler.h"
#include "button_input.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"
#include "sleep_handler.h"

static volatile int64_t sleep_timer_start_us = 0;
static volatile uint32_t awake_duration_ms = 0;

void init_sleep_handler() {
    esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0 || wakeup_reason == ESP_SLEEP_WAKEUP_EXT1)
        awake_duration_ms = BUTTON_AWAKE_TIME_MS;
    else
        awake_duration_ms = 0;

    sleep_timer_start_us = esp_timer_get_time();
}

void notify_sleep_button_activity() {
    awake_duration_ms = BUTTON_AWAKE_TIME_MS;
    sleep_timer_start_us = esp_timer_get_time();
}

void reset_sleep_timer_on_advertising() {
    sleep_timer_start_us = esp_timer_get_time();
}

void reset_sleep_on_disconnect() {
    awake_duration_ms = 0;
    sleep_timer_start_us = esp_timer_get_time();
}

void configure_wakeup_sources(uint8_t enable_timer) {
    esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

    if (enable_timer)
        esp_sleep_enable_timer_wakeup(SLEEP_TIME_US);

    uint8_t button_inp = (uint8_t)gpio_get_level(BUTTON_INPUT);
    esp_sleep_enable_ext0_wakeup(BUTTON_INPUT, button_inp == HIGH ? LOW : HIGH);

    if (get_aux_status() == AUX_ENABLED) {
        uint64_t low_mask = 0;
        if (gpio_get_level(AUX_ONE_INPUT) == HIGH)
            low_mask |= (1ULL << AUX_ONE_INPUT);
        if (gpio_get_level(AUX_TWO_INPUT) == HIGH)
            low_mask |= (1ULL << AUX_TWO_INPUT);

        if (low_mask != 0)
            esp_sleep_enable_ext1_wakeup(low_mask, ESP_EXT1_WAKEUP_ANY_LOW);
        else
            esp_sleep_enable_ext1_wakeup((1ULL << AUX_ONE_INPUT) | (1ULL << AUX_TWO_INPUT), ESP_EXT1_WAKEUP_ANY_HIGH);
    }
}

static uint8_t is_system_busy_for_sleep() {
    if (is_button_input_busy())
        return 1;

    if (get_command_busy() || get_custom_command_executing())
        return 1;

    if (movement_stats.left_moving || movement_stats.right_moving)
        return 1;

    if (command_output_queue != NULL && uxQueueMessagesWaiting(command_output_queue) > 0)
        return 1;

    if (custom_command_queue_handle != NULL && uxQueueMessagesWaiting(custom_command_queue_handle) > 0)
        return 1;

    if (left_output_queue != NULL && uxQueueMessagesWaiting(left_output_queue) > 0)
        return 1;

    if (right_output_queue != NULL && uxQueueMessagesWaiting(right_output_queue) > 0)
        return 1;

    return 0;
}

void sleep_task(void* args) {
    for (;;) {
        vTaskDelay(pdMS_TO_TICKS(25));

        if (get_device_status() != DISCONNECTED)
            continue;

        if (is_system_busy_for_sleep())
            continue;

        int64_t elapsed_ms = (esp_timer_get_time() - sleep_timer_start_us) / 1000;
        if (elapsed_ms <= ADVERTISE_TIME_MS || elapsed_ms <= (int64_t)awake_duration_ms)
            continue;

        // Abort sleep if any input pin transitioned right before sleep entry
        if ((uint8_t)gpio_get_level(BUTTON_INPUT) != get_button_state() || aux_input_has_pending_edge()) {
            notify_sleep_button_activity();
            continue;
        }

        configure_wakeup_sources(1);

        if (get_device_status() == DISCONNECTED && !is_system_busy_for_sleep())
            esp_deep_sleep_start();
    }
}
