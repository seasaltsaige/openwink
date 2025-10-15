#ifndef __GPIO_CONF
#define __GPIO_CONF

#include "driver/gpio.h"
#include <hal/gpio_types.h>

gpio_config_t LEFT_DOWN_OUT = {
    .pin_bit_mask = GPIO_NUM_10,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t LEFT_UP_OUT = {
    .pin_bit_mask = GPIO_NUM_11,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t RIGHT_DOWN_OUT = {
    .pin_bit_mask = GPIO_NUM_12,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t RIGHT_UP_OUT = {
    .pin_bit_mask = GPIO_NUM_13,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t BUTTON_INPUT = {
    .pin_bit_mask = GPIO_NUM_9,
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t HEADLIGHT_STATUS = {
    .pin_bit_mask = GPIO_NUM_46,
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

void inputs_conf();
void outputs_conf();

void INIT_gpio();

#endif