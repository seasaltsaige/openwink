#ifndef __CONSTANTS
#define __CONSTANTS
#include "driver/gpio.h"
#include <array>
#include <string>
#include <vector>


// #define LEFT_DOWN_OUT GPIO_NUM_10
// #define LEFT_UP_OUT GPIO_NUM_11
// #define RIGHT_DOWN_OUT GPIO_NUM_12
// #define RIGHT_UP_OUT GPIO_NUM_13
// #define BUTTON_INPUT GPIO_NUM_9
// #define HEADLIGHT_STATUS GPIO_NUM_46

#define SLEEP_TIME_US 15 * 1000 * 1000
#define AWAKE_TIME_DEFAULT_MS 1.5 * 1000
#define AWAKE_TIME_INTR_MS 5 * 60 * 1000

#define BUTTON_DEBOUNCE_US 50 * 1000

using namespace std;

enum HEADLIGHT_COMMAND
{
    NO_ACTION = -1,
    MOVE_TO_BUTTON,
    BOTH_UP,
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
    SLEEPY,
};

typedef struct CustomCommand
{
    vector<HEADLIGHT_COMMAND> commands;
} CustomCommand;

class Settings
{
    public:
    static gpio_num_t LEFT_DOWN_OUT;
    static gpio_num_t LEFT_UP_OUT;
    static gpio_num_t RIGHT_DOWN_OUT;
    static gpio_num_t RIGHT_UP_OUT;
    static gpio_num_t BUTTON_INPUT;
    static gpio_num_t HEADLIGHT_STATUS_LEFT;
    static gpio_num_t HEADLIGHT_STATUS_RIGHT;

    static int16_t multi_press_timeout;
    static bool custom_press_enabled;
    static bool bypass_headlight_restriction;

    static float wave_move_delay;

    static float left_sleepy_percentage;
    static float right_sleepy_percentage;

    static array<CustomCommand, 10> button_press_responses;

    static int64_t left_move_time;
    static int64_t right_move_time;

    static void save_to_flash();
    static void load_from_flash();

    // static void init()
    // {
    // }
};


enum LEVEL
{
    LOW = 0,
    HIGH = 1,
};


enum WAVE_START_SIDE
{
    LEFT,
    RIGHT,
};

#endif