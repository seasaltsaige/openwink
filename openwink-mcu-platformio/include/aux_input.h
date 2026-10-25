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

#define AUX_SIDE_LEN 1
#define AUX_TYPE_LEN 1

// AUX packet structures:
// delete aux binding:
// [side][BINDING_DELETE_FLAG]
//
// set aux binding:
// [side][aux_button_t payload (button_type + button_binding_t)]

#define MIN_AUX_PAYLOAD_LEN (AUX_TYPE_LEN + MIN_BINDING_PAYLOAD_LEN)
#define MAX_AUX_PAYLOAD_LEN sizeof(aux_button_t)

extern TaskHandle_t aux_one_task_handle;
extern TaskHandle_t aux_two_task_handle;

typedef enum AUX_SIDE : uint8_t {
    ONE,
    TWO,
} aux_side_t;

typedef enum AUX_STATUS : uint8_t {
    AUX_DISABLED,
    AUX_ENABLED,
} aux_status_t;

typedef enum AUX_TYPE : uint8_t {
    AUX_LATCHING,
    AUX_MOMENTARY,
} aux_type_t;

typedef struct {
    aux_type_t button_type;
    button_binding_t action;
} aux_button_t;


typedef struct {
    uint8_t state;
    aux_button_t aux;
} aux_button_state_t;

typedef struct {
    uint8_t status;
    aux_button_state_t one;
    aux_button_state_t two;
} aux_buttons_t;

#ifdef __cplusplus
extern "C" {
#endif

// Read status from NVS, get one/two bindings
// enable/disable, init gpio if enabled
void init_aux();
void reload_aux();

void set_aux_status(uint8_t status);
uint8_t get_aux_status();
uint8_t aux_input_has_pending_edge();

// returns 1 on success and 0 on invalid
uint8_t validate_aux(aux_button_t* aux, size_t size);

void update_aux(aux_side_t side, aux_button_t* aux);
void get_aux(aux_side_t side, aux_button_t* aux);
void delete_aux(aux_side_t side);

void aux_one_input_task(void* args);
void aux_two_input_task(void* args);

#ifdef __cplusplus
}
#endif

#endif