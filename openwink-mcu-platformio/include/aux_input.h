#ifndef AUX_INPUT_H
#define AUX_INPUT_H

#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#include "button_bindings.h"
#include "output_handler.h"

#define AUX_ONE_INPUT GPIO_NUM_14
#define AUX_TWO_INPUT GPIO_NUM_21

extern TaskHandle_t aux_one_task_handle;
extern TaskHandle_t aux_two_task_handle;

typedef enum AUX_SIDE : uint8_t {
    ONE,
    TWO,
} aux_side_t;

typedef enum AUX_STATUS : uint8_t {
    DISABLED,
    ENABLED,
} aux_status_t;

struct aux_button {
    uint8_t state;
    button_binding_t action;
};

typedef struct {
    uint8_t status;
    struct aux_button one;
    struct aux_button two;
} aux_buttons_t;

// Read status from NVS, get one/two bindings
// enable/disable, init gpio if enabled
void init_aux();

void update_action(aux_side_t side);

void aux_input_task();

#endif