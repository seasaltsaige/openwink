#ifndef COMMAND_OUTPUT_H
#define COMMAND_OUTPUT_H

#include <freertos/FreeRTOS.h>

extern TaskHandle_t command_task;

typedef struct command_state_data
{
    uint8_t busy;
} command_state_data;

typedef struct __attribute__((__packed__))
{
    uint16_t command;
} command_type;

typedef enum COMMAND_TYPES : uint8_t
{
    // Actual command outputs
    // may change/set to byte codes to align
    // with future custom commands
    BOTH_UP,
    BOTH_DOWN,
    BOTH_BLINK,
    LEFT_UP,
    LEFT_DOWN,
    LEFT_WINK,
    RIGHT_UP,
    RIGHT_DOWN,
    RIGHT_WINK,
    LEFT_WAVE,
    RIGHT_WAVE,
    LEFT_RIGHT,
    LEFT_RIGHT_X2,
    RIGHT_LEFT,
    RIGHT_LEFT_X2,
    SLEEPY,

    // Settings actions
    // ported from legacy code
    // it likely makes sense to have these
    // somewhere else
    SWAP_ORIENTATION,
    RESET_MCU,

    // Util
    // also likely going to be moved
    // the custom_command_handler will be separate
    // and will handle looping, and thus being interrupted
    INTERRUPT_CUSTOM_COMMAND
} COMMAND_TYPES;

extern QueueHandle_t command_output_queue;
extern TaskHandle_t command_output_task;

void init_command_queue();
void handle_command_task();

#endif