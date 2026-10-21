#ifndef BUTTON_BINDINGS_H
#define BUTTON_BINDINGS_H


#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "custom_command_output.h"

// single press is ALWAYS default action
// so 8 more button bindings to 9 sequential presses
#define NUM_BINDINGS 8

// the only reason this is ok is due to the fact
// that a button binding packet, after 'pos'
// will ALWAYS have the type, which is limited to the
// below values in button_bindings_type_t
// so we can then immediately know if its a deletion request
// with this flag

// packet length can be anywhere from 2 bytes to 184 bytes
#define BINDING_DELETE_FLAG 0xDD

// just for now, might expand...
// it really doesnt make a lot of sense *for humans*
// to have something out of this range though
#define BINDING_DELAY_MIN 100
#define BINDING_DELAY_MAX 1000


#define BINDING_POS_LEN 1
#define BINDING_TYP_LEN 1
// packet structure:

// delete binding:
// [pos][BINDING_DELETE_FLAG]

// set binding:
// [pos][button_binding_t payload]

// this can result in a payload of 184 bytes (1 byte over usable packet len)
// this will be fine as long as calls are made w/ writeWithResponse

// all settings should probably be writeWithResponse anyways

// min = [pos][delete]
#define MIN_BINDING_PAYLOAD_LEN (BINDING_POS_LEN + 1)
// max = [pos][max len binding]
#define MAX_BINDING_PAYLOAD_LEN (BINDING_POS_LEN + sizeof(button_binding_t))

typedef enum BINDING_STATUS : uint8_t {
    BINDING_DISABLED,
    BINDING_ENABLED,
} button_binding_status_t;

typedef enum BINDING_TYPE : uint8_t {
    BINDING_NONE,
    BINDING_BUILTIN,
    BINDING_CUSTOM_SEQUENCE,

    // Mostly for aux buttons
    BINDING_SETTING,
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

void init_button_bindings();

void set_binding_at_pos(button_binding_t* binding, uint8_t pos);
void get_binding_at_pos(button_binding_t* binding, uint8_t pos);
void delete_binding_at_pos(uint8_t pos);

void set_custom_button_status(uint8_t status);
uint8_t get_custom_button_status();

void set_custom_button_delay(uint16_t delay);
uint16_t get_custom_button_delay();

uint8_t validate_button_binding(button_binding_t* binding, size_t size);

#ifdef __cplusplus
}
#endif


#endif