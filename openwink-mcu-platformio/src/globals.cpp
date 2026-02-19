#include "globals.h"


void Settings::load_from_flash()
{
    // TODO: Actually load from flash, instead of just setting defaults
    LEFT_DOWN_OUT = GPIO_NUM_10;
    LEFT_UP_OUT = GPIO_NUM_11;
    RIGHT_DOWN_OUT = GPIO_NUM_12;
    RIGHT_UP_OUT = GPIO_NUM_13;
    BUTTON_INPUT = GPIO_NUM_9;
    HEADLIGHT_STATUS_RIGHT = GPIO_NUM_46;
    HEADLIGHT_STATUS_LEFT = GPIO_NUM_3;

    multi_press_timeout = 500;
    // DEFAULT
    // custom_press_enabled = false;
    // Temporarily enabled for testing
    custom_press_enabled = true;
    // bypass_headlight_restriction = false;
    bypass_headlight_restriction = true;

    // Wait 50% of the first headlights movement before starting the second
    wave_move_delay = 0.5;

    left_sleepy_percentage = 0.5;
    right_sleepy_percentage = 0.5;

    left_move_time = 750;
    right_move_time = 750;

    for (int i = 0; i < 10; i++)
    {
        if (i == 0)
        {
            CustomCommand cmd = { .commands = { MOVE_TO_BUTTON } };
            button_press_responses[0] = cmd;
        }
        else
        {
            CustomCommand cmd = { .commands = { NO_ACTION } };
            button_press_responses[i] = cmd;
        }
    }
}


void Settings::save_to_flash()
{
}
