#ifndef BUTTON_INPUT_H
#define BUTTON_INPUT_H

#include <freertos/task.h>
#include <driver/gpio.h>

#define BUTTON_INPUT GPIO_NUM_9

typedef struct button_input_data {
    uint8_t button_state;

} button_input_data;

extern button_input_data input_data;

void inputs_init();
void read_input_on_boot();
void input_read_task();

#endif