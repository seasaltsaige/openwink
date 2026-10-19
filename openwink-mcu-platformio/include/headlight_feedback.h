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
#define DEFAULT_MOVE_TIME_MS 625
#define MOVE_TIME_DEADBAND_MS 10

typedef struct feedback_stats {
    uint16_t left_move_time;
    uint16_t right_move_time;
    uint8_t left_moving;
    uint8_t right_moving;
} feedback_stats_t;

extern feedback_stats_t movement_stats;
extern EventGroupHandle_t movement_event;
extern TaskHandle_t left_feedback_task;
extern TaskHandle_t right_feedback_task;

#ifdef __cplusplus
extern "C" {
#endif


void monitor_gpio_init();
void monitor_event_group_init();

uint16_t get_left_move_time_ms();
uint16_t get_right_move_time_ms();

void left_monitor_task(void* args);
void right_monitor_task(void* args);

#ifdef __cplusplus
}
#endif

#endif