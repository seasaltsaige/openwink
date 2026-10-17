#include "aux_input.h"


aux_buttons_t aux_buttons = {
    .status = DISABLED,
    .one = {
        .state = HIGH,
        .action = {
            .type = BINDING_BUILTIN,
            .data = COMMAND_LEFT_WINK,
        },
    },
    .two = {
        .state = HIGH,
        .action = {
            .type = BINDING_BUILTIN,
            .data = COMMAND_RIGHT_WINK,
        }
    },
};
