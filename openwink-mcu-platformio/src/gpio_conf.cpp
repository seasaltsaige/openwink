#include "../include/gpio_conf.h"
#include "driver/gpio.h"

void inputs_conf()
{
    gpio_config(&BUTTON_INPUT);
    gpio_config(&HEADLIGHT_STATUS);
}

void outputs_conf()
{
    gpio_config(&LEFT_DOWN_OUT);
    gpio_config(&LEFT_UP_OUT);
    gpio_config(&RIGHT_DOWN_OUT);
    gpio_config(&RIGHT_UP_OUT);
}

void INIT_gpio()
{
    inputs_conf();
    outputs_conf();
}