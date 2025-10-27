#ifndef __HEADLIGHT_OUTPUT
#define __HEADLIGHT_OUTPUT

#include "globals.h"

class HeadlightOutputHandler
{

    private:
    static void set_pins_low();
    static void wave(WAVE_START_SIDE start_side);

    public:
    static bool custom_button;
    static double wave_delay;
    static int max_time_button_press_ms;
    
    struct HeadlightStatus
    {
        static int left;
        static int right;
    };

    static void init()
    {
        HeadlightStatus::left = 0;
        HeadlightStatus::right = 0;
    }

    static void send_command(HEADLIGHT_COMMAND command);
};

#endif