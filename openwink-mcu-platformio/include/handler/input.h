#ifndef __BUTTON_HANDLER
#define __BUTTON_HANDLER

#include <cstdint>

#include "globals.h"


#define MOVEMENT_DEBOUNCE_US 150 * 1000


typedef struct ButtonEvent
{
    int64_t event_time;
    LEVEL button_level;
} ButtonEvent;
QueueHandle_t button_queue;


class MovementHandler
{
    private:
    static void update_settings();

    public:
    static int64_t left_move_start_time;
    static int64_t right_move_start_time;

    static bool left_moving;
    static bool right_moving;

    static void init();

    static void poll_left(LEVEL left_state);
    static void poll_right(LEVEL right_state);
};

#endif