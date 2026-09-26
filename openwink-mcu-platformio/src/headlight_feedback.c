#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "headlight_feedback.h"

feedback_stats_t movement_stats = {
    .left_move_time = 0,
    .right_move_time = 0,
    .left_moving = 0,
    .right_moving = 0,
};

EventGroupHandle_t movement_event;

void monitor_event_group_init()
{
    movement_event = xEventGroupCreate();
    xEventGroupSetBits(movement_event, (LEFT_STOPPED_BIT | RIGHT_STOPPED_BIT));
}

void monitor_gpio_init()
{

    gpio_config_t feedback_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_INPUT,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pin_bit_mask = (1ULL << LEFT_MONITOR_PIN | 1ULL << RIGHT_MONITOR_PIN),
    };
    gpio_config(&feedback_config);
}

void left_monitor_task()
{
    int64_t move_start = 0;
    uint8_t last_level = 0;
    for (;;)
    {
        uint8_t curr_state = gpio_get_level(LEFT_MONITOR_PIN);
        // movement start
        if ((last_level == 0) && (curr_state == 1))
        {
            // Dont need to clear event bits since they are cleared by the movement commanding
            move_start = esp_timer_get_time();
            last_level = 1;
            movement_stats.left_moving = 1;
        }
        else if ((last_level == 1) && (gpio_get_level(LEFT_MONITOR_PIN) == 0))
        {
            // move time in ms
            movement_stats.left_move_time = (esp_timer_get_time() - move_start);
            last_level = 0;
            movement_stats.left_moving = 0;
            xEventGroupSetBits(movement_event, LEFT_STOPPED_BIT);
        }
        last_level = curr_state;
        vTaskDelay(pdMS_TO_TICKS(4));
    }
}

void right_monitor_task()
{
    int64_t move_start = 0;
    uint8_t last_level = 0;
    for (;;)
    {
        uint8_t curr_state = gpio_get_level(RIGHT_MONITOR_PIN);
        // movement start
        if ((last_level == 0) && (curr_state == 1))
        {
            // Dont need to clear event bits since they are cleared by the movement commanding
            move_start = esp_timer_get_time();
            last_level = 1;
            movement_stats.right_moving = 1;
        }
        else if ((last_level == 1) && (gpio_get_level(RIGHT_MONITOR_PIN) == 0))
        {
            // move time in ms
            movement_stats.right_move_time = (esp_timer_get_time() - move_start);
            last_level = 0;
            movement_stats.right_moving = 0;
            xEventGroupSetBits(movement_event, RIGHT_STOPPED_BIT);
        }
        last_level = curr_state;
        vTaskDelay(pdMS_TO_TICKS(4));
    }
}