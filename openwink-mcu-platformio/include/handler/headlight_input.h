#ifndef __HANDLER_HEADLIGHT_INPUT
#define __HANDLER_HEADLIGHT_INPUT

class HeadlightInputHandler
{

    public:
    static int headlight_delay_ms;
    static void init()
    {
        // TODO: Read from NVS
        headlight_delay_ms = 750;
    };
};

#endif