#include "gpio_conf.h"
#include "common.h"
#include "driver/gpio.h"

gpio_config_t LEFT_DOWN_OUT_CONF = {
    .pin_bit_mask = LEFT_DOWN_OUT,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t LEFT_UP_OUT_CONF = {
    .pin_bit_mask = LEFT_UP_OUT,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t RIGHT_DOWN_OUT_CONF = {
    .pin_bit_mask = RIGHT_DOWN_OUT,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t RIGHT_UP_OUT_CONF = {
    .pin_bit_mask = RIGHT_UP_OUT,
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

gpio_config_t BUTTON_INPUT_CONF = {
    .pin_bit_mask = BUTTON_INPUT,
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_ANYEDGE,
};

gpio_config_t HEADLIGHT_STATUS_CONF = {
    .pin_bit_mask = HEADLIGHT_STATUS,
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_ANYEDGE,
};

void inputs_conf()
{
    gpio_config(&BUTTON_INPUT_CONF);
    gpio_config(&HEADLIGHT_STATUS_CONF);
}

void outputs_conf()
{
    gpio_config(&LEFT_DOWN_OUT_CONF);
    gpio_config(&LEFT_UP_OUT_CONF);
    gpio_config(&RIGHT_DOWN_OUT_CONF);
    gpio_config(&RIGHT_UP_OUT_CONF);
}

void INIT_gpio()
{
    inputs_conf();
    outputs_conf();
}