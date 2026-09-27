#ifndef OUTPUT_HANDLER_H
#define OUTPUT_HANDLER_H

#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>

#define OUT_PIN_LEFT_DOWN GPIO_NUM_10
#define OUT_PIN_LEFT_UP GPIO_NUM_11
#define OUT_PIN_RIGHT_DOWN GPIO_NUM_12
#define OUT_PIN_RIGHT_UP GPIO_NUM_13

#define OUTPUT_QUEUE_LENGTH 2

#define HIGH (uint8_t)1
#define LOW (uint8_t)0

#define POSITION_DOWN ((uint8_t)0)
#define POSITION_UP ((uint8_t)100)
#define POSITION_UNKNOWN ((uint8_t)255)

#define MAX_WAIT_TIME_MS pdMS_TO_TICKS(1000)


#define LEFT_SIDE BIT0
#define RIGHT_SIDE BIT1
#define LEFT_COMPLETE_BIT BIT0
#define RIGHT_COMPLETE_BIT BIT1

typedef enum MOVE_TYPE : uint8_t
{
    MOVE_NOP,
    MOVE_DOWN,
    MOVE_UP,
    MOVE_PARTIAL,
} move_type_t;

typedef struct headlight_position
{
    uint8_t left_pos;
    uint8_t right_pos;
    /**
     * utility to keep track of last
     * known headlight move direction
     * potentially can be used to allow
     * sleepy eye to be entered from down or up
     * or really any position.
     * Should have EITHER UP_DIR or DOWN_DIR
     * set, never both
     */
    move_type_t last_left_move_dir;
    move_type_t last_right_move_dir;
} headlight_position_t;

/**
 * @param queue
 */
typedef struct output_args
{
    QueueHandle_t queue;
    gpio_num_t up_pin;
    gpio_num_t down_pin;
    EventBits_t stopped_bit;
    EventBits_t move_complete_bit;
    uint8_t side_bit;
} output_args_t;


typedef struct movement_target
{
    move_type_t target;
    uint8_t final_move;
} movement_target_t;

extern QueueHandle_t left_output_queue;
extern QueueHandle_t right_output_queue;
extern EventGroupHandle_t output_event_group;

void outputs_init();
void output_queue_init();
void output_event_group_init();

uint8_t is_left_sleepy();
uint8_t is_right_sleepy();

headlight_position_t get_position();
void handle_output_task(void* args);


#endif