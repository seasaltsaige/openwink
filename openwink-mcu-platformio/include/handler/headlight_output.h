#ifndef __HEADLIGHT_OUTPUT
#define __HEADLIGHT_OUTPUT

#include "../common.h"

class HeadlightOutputHandler
{

    private:
    static void set_pins_low();

    public:
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