#include "aux_input.h"

TaskHandle_t aux_one_task_handle;
TaskHandle_t aux_two_task_handle;

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
