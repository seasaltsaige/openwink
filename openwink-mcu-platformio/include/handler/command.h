#ifndef __CUSTOM_CMD
#define __CUSTOM_CMD
#include "globals.h"
#include <cstdint>

enum CommandState
{
    IDLE,
    LEFT_UP,
    LEFT_DOWN,
    RIGHT_UP,
    RIGHT_DOWN,
    BOTH_UP,
    BOTH_DOWN,
    LEFT_WINK,
    RIGHT_WINK,
    BOTH_BLINK,
    WAVE,
    SLEEPY_ENTER,
    SLEEPY_EXIT,

    BUSY_CUSTOM,
};

enum CommandExecutionState
{
    IDLE,
    UP,
    DOWN,


    WAVE_START_SIDE,
    WAVE_START_OPP,
    WAVE_RETURN_SIDE,
    WAVE_RETURN_OPP,
    WAVE_DONE_SIDE,
    WAVE_DONE_OPP,
    WAVE_FINISH,

};

class CommandHandler
{
    private:
    CommandState command_state;
    CommandExecutionState execution_state;

    public:
    static void request_movement(uint8_t press_count);
    static void request_movement(HEADLIGHT_COMMAND command);

    static void step_movement();
};

#endif