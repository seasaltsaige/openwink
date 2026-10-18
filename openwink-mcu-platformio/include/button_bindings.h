#ifndef BUTTON_BINDINGS_H
#define BUTTON_BINDINGS_H

#include "command_output.h"
#include "custom_command_output.h"


#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

// single press is ALWAYS default action
// so 8 more button bindings to 9 sequential presses
#define NUM_BINDINGS 8

typedef enum BINDING_TYPE : uint8_t {
    BINDING_NONE,
    BINDING_BUILTIN,
    BINDING_CUSTOM_SEQUENCE,
} button_bindings_type_t;

typedef struct {
    button_bindings_type_t type;
    union {
        custom_command_data_t custom;
        command_t builtin;
    } data;
} button_binding_t;

typedef struct {
    uint8_t custom_actions_enabled;
    uint16_t button_delay_ms;

    button_binding_t bindings[NUM_BINDINGS];
} button_config_t;

#ifdef __cplusplus
extern "C" {
#endif

void set_binding_at_pos(button_binding_t binding, uint8_t pos);
button_binding_t get_binding_at_pos(uint8_t pos);
void delete_binding_at_pos(uint8_t pos);

void set_custom_button_status(uint8_t status);
uint8_t get_custom_button_status();

void set_custom_button_delay(uint16_t delay);
uint16_t get_custom_button_delay();


#ifdef __cplusplus
}
#endif


#endif