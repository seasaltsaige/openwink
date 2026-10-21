#ifndef BUTTON_INPUT_H
#define BUTTON_INPUT_H

#include <driver/gpio.h>

#include "button_bindings.h"

#define BUTTON_INPUT GPIO_NUM_9

typedef enum BYPASS : uint8_t {
    BYPASS_DISABLED,
    BYPASS_ENABLED,
} headlight_bypass_status_t;

typedef struct button_input {
    uint8_t button_state;
    headlight_bypass_status_t headlight_bypass;
} button_input_t;

#ifdef __cplusplus
extern "C" {
#endif


void inputs_init();
void read_input_on_boot();
void set_input_headlight_bypass(uint8_t status);
void input_read_task(void* args);

#ifdef __cplusplus
}
#endif

#endif