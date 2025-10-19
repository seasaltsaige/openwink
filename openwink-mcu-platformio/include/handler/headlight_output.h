#ifndef __HEADLIGHT_OUTPUT
#define __HEADLIGHT_OUTPUT

enum HEADLIGHT_COMMAND
{
    BOTH_UP = 1,
    BOTH_DOWN,
    BOTH_BLINK,
    LEFT_UP,
    LEFT_DOWN,
    LEFT_WINK,
    RIGHT_UP,
    RIGHT_DOWN,
    RIGHT_WINK,
    WAVE_LEFT,
    WAVE_RIGHT,
};

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