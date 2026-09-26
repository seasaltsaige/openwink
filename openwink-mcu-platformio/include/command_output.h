#ifndef COMMAND_OUTPUT_H
#define COMMAND_OUTPUT_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>


typedef struct command_state_data
{
    uint8_t busy;
} command_state_data_t;

typedef uint8_t command_t;

typedef enum command_types : uint8_t
{
    // Actual command outputs
    // may change/set to byte codes to align
    // with future custom commands

    // defining every single one is not needed
    // but is nice for reading
    BOTH_UP = 0x01,
    BOTH_DOWN = 0x02,
    BOTH_BLINK = 0x03,
    LEFT_UP = 0x04,
    LEFT_DOWN = 0x05,
    LEFT_WINK = 0x06,
    RIGHT_UP = 0x07,
    RIGHT_DOWN = 0x08,
    RIGHT_WINK = 0x09,
    LEFT_WAVE = 0x0A,
    RIGHT_WAVE = 0x0B,
    LEFT_RIGHT = 0x0C,
    LEFT_RIGHT_X2 = 0x0D,
    RIGHT_LEFT = 0x0E,
    RIGHT_LEFT_X2 = 0x0F,
    SLEEPY_EYE = 0x10,

    // Settings actions
    // ported from legacy code
    // it likely makes sense to have these
    // somewhere else

    // tbd
    SWAP_ORIENTATION,
    RESET_MCU,

    // Util
    // also likely going to be moved
    // the custom_command_handler will be separate
    // and will handle looping, and thus being interrupted
    INTERRUPT_CUSTOM_COMMAND
} command_types_t;

extern QueueHandle_t command_output_queue;
extern TaskHandle_t command_output_task;

void init_command_queue();
void handle_command_task();

#endif