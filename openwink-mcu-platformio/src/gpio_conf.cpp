#include "gpio_conf.h"
#include "../include/common.h"
#include "driver/gpio.h"

// --- GPIO DEFS ---
// Outputs from the ESP
gpio_config_t OUT_CONF = {
    .pin_bit_mask = (1ULL << LEFT_DOWN_OUT) | (1ULL << LEFT_UP_OUT) | (1ULL << RIGHT_DOWN_OUT) | (1ULL << RIGHT_UP_OUT),
    .mode = GPIO_MODE_OUTPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_DISABLE,
};

// Inputs into the ESP
gpio_config_t INPUT_CONF = {
    .pin_bit_mask = (1ULL << BUTTON_INPUT) | (1ULL << HEADLIGHT_STATUS),
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_ANYEDGE,
};
// --- END GPIO DEFS --

void INIT_gpio()
{
    gpio_config(&OUT_CONF);
    gpio_config(&INPUT_CONF);
}