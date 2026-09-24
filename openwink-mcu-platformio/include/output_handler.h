#ifndef OUTPUT_HANDLER_H
#define OUTPUT_HANDLER_H

#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>

#define OUT_PIN_LEFT_DOWN GPIO_NUM_10
#define OUT_PIN_LEFT_UP GPIO_NUM_11
#define OUT_PIN_RIGHT_DOWN GPIO_NUM_12
#define OUT_PIN_RIGHT_UP GPIO_NUM_13

#define HIGH (uint8_t)1
#define LOW (uint8_t)0

#define UNKNOWN_POSITION ((uint8_t)255)

typedef struct headlight_position
{
    uint8_t left_pos;
    uint8_t right_pos;

    // utility to keep track of last
    // known headlight move direction
    // potentially can be used to allow
    // sleepy eye to be entered from down or up
    // or really any position.
    // Should have EITHER UP_DIR or DOWN_DIR
    // set, never both
    uint8_t last_left_move_dir;
    uint8_t last_right_move_dir;
} headlight_position_t;


#define LEFT_SIDE BIT0
#define RIGHT_SIDE BIT1

typedef enum MOVE_TYPE : uint8_t
{
    NOP,
    DOWN,
    UP,
    SLEEPY,
} MOVE_TYPE;

typedef struct __attribute__((__packed__))
{
    MOVE_TYPE left_target;
    MOVE_TYPE right_target;
} movement_target_t;

extern QueueHandle_t output_queue;

void outputs_init();
void output_queue_init();

uint8_t is_left_sleepy();
uint8_t is_right_sleepy();

headlight_position_t get_position();
void handle_output_task();

#endif