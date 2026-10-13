#ifndef BUTTON_INPUT_H
#define BUTTON_INPUT_H

#include "button_bindings.h"

#include <driver/gpio.h>


#define BUTTON_INPUT GPIO_NUM_9

typedef struct button_input {
    uint8_t button_state;
} button_input_t;

extern button_config_t button_config;

void inputs_init();
void read_input_on_boot();
void input_read_task();

#endif