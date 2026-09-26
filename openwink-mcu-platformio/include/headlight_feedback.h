#ifndef HEADLIGHT_FEEDBACK_H
#define HEADLIGHT_FEEDBACK_H

#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>

#define LEFT_MONITOR_PIN GPIO_NUM_3
#define RIGHT_MONITOR_PIN GPIO_NUM_46

#define LEFT_STOPPED_BIT BIT0
#define RIGHT_STOPPED_BIT BIT1

#define MOVE_TIME_LIMIT_MS 1000

typedef struct feedback_stats
{
    int64_t left_move_time;
    int64_t right_move_time;
    uint8_t left_moving;
    uint8_t right_moving;
} feedback_stats_t;

extern EventGroupHandle_t movement_event;

void monitor_gpio_init();
void monitor_event_group_init();

void left_monitor_task();
void right_monitor_task();

#endif