#include "button_bindings.h"


// default configuration
// check wakeup reason on boot, if not from a sleep wakeup, read from nvs to set
RTC_DATA_ATTR button_config_t button_config = {
    .button_delay_ms = 500,
    .custom_actions_enabled = 1,
    .bindings = {
        [0] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_LEFT_WINK,
        },
        [1] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_RIGHT_WINK,
        },
        [2] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_BOTH_BLINK,
        },
        [3] = {
            .type = BINDING_BUILTIN,
            .data.builtin = COMMAND_SLEEPY_EYE,
        },
        [4] = {
            .data = BINDING_NONE,
            .data = 0,
        },
        [5]  = {
            .data = BINDING_NONE,
            .data = 0,
        },
        [6]  = {
            .data = BINDING_NONE,
            .data = 0,
        },
        [7]  = {
            .data = BINDING_NONE,
            .data = 0,
        },
    },
};

void set_binding_at_pos(button_binding_t binding, uint8_t pos) {
}

button_binding_t get_binding_at_pos(uint8_t pos) {
}

void delete_binding_at_pos(uint8_t pos) {
}


void set_custom_button_status(uint8_t status) {
}
uint8_t get_custom_button_status() {
}

void set_custom_button_delay(uint16_t delay) {
}
uint16_t get_custom_button_delay() {
}