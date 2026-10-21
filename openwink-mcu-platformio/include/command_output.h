#ifndef COMMAND_OUTPUT_H
#define COMMAND_OUTPUT_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#define NOTIFY_COMMAND_DONE_BIT (1UL << 1)

#define WAVE_DELAY_MAX (uint8_t)100

typedef struct command_state_data {
    uint8_t busy;
    // used to represent the fractional delay between when headlights start
    // moving for waves. represented using an integer, values 0 to 100
    // needs to be converted to a float (wave_delay / 100f) before use
    uint8_t wave_delay;
} command_state_data_t;

typedef uint8_t command_t;

typedef enum command_types : uint8_t {
    COMMAND_NONE,
    // Actual command outputs
    // may change/set to byte codes to align
    // with future custom commands

    // defining every single one is not needed
    // but is nice for reading
    COMMAND_BOTH_UP = 0x01,
    COMMAND_BOTH_DOWN,
    COMMAND_BOTH_BLINK,
    COMMAND_BOTH_BLINK_X2,
    COMMAND_LEFT_UP,
    COMMAND_LEFT_DOWN,
    COMMAND_LEFT_WINK,
    COMMAND_LEFT_WINK_X2,
    COMMAND_RIGHT_UP,
    COMMAND_RIGHT_DOWN,
    COMMAND_RIGHT_WINK,
    COMMAND_RIGHT_WINK_X2,
    COMMAND_LEFT_WAVE,
    COMMAND_RIGHT_WAVE,
    COMMAND_LEFT_RIGHT,
    COMMAND_LEFT_RIGHT_X2,
    COMMAND_RIGHT_LEFT,
    COMMAND_RIGHT_LEFT_X2,
    COMMAND_SLEEPY_EYE,

    // Settings actions
    // ported from legacy code
    // it likely makes sense to have these
    // somewhere else

    // tbd
    // reset mcu maybe, since it is a predefined sequence...
    // maybe also just check if we hit 20 presses, then queue those movements...
    // perhap... or even a custom command? but i dont think it should be interruptable.
    // SWAP_ORIENTATION,
    // UNPAIR_MCU,
    // RESET_MCU,
} command_types_t;

extern QueueHandle_t command_output_queue;
extern TaskHandle_t command_output_task;

#ifdef __cplusplus
extern "C" {
#endif

void init_command_queue();
void set_wave_delay(uint8_t delay);
void set_command_busy(uint8_t busy);
uint8_t get_command_busy();
void handle_command_task(void* args);

#ifdef __cplusplus
}
#endif

#endif
