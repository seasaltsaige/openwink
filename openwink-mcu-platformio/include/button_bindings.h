#ifndef BUTTON_BINDINGS_H
#define BUTTON_BINDINGS_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

typedef enum
{
    BINDING_NONE,
    BINDING_BUILTIN,
    BINDING_CUSTOM_SEQUENCE,
} button_bindings_type_t;

typedef struct
{
    button_bindings_type_t type;
    uint8_t looping;

    union
    {
    } data;
} button_binding_t;

typedef struct
{
    uint8_t custom_actions_enabled;
    uint16_t button_delay;

} button_config_t;


// button_config_t
// uint8_t

#endif