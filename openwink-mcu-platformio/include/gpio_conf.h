#ifndef __GPIO_CONF
#define __GPIO_CONF

#include "driver/gpio.h"
#include <hal/gpio_types.h>

extern gpio_config_t LEFT_DOWN_OUT_CONF;
extern gpio_config_t LEFT_UP_OUT_CONF;
extern gpio_config_t RIGHT_DOWN_OUT_CONF;
extern gpio_config_t RIGHT_UP_OUT_CONF;
extern gpio_config_t BUTTON_INPUT_CONF;
extern gpio_config_t HEADLIGHT_STATUS_CONF;

void inputs_conf();
void outputs_conf();

void INIT_gpio();

#endif