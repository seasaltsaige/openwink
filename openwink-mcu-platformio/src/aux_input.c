#include <FreeRTOSConfig.h>
#include <driver/rtc_io.h>
#include <esp_sleep.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <string.h>

#include "aux_input.h"
#include "ble/debugger/ble_debugger.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "storage_handler.h"

static const char* TAG = "AUX";

TaskHandle_t aux_one_task_handle;
TaskHandle_t aux_two_task_handle;

static SemaphoreHandle_t aux_lock;

RTC_DATA_ATTR aux_buttons_t aux_buttons = {
    .status = AUX_DISABLED,
    .one = {
        .state = HIGH,
        .aux = {
            .button_type = AUX_MOMENTARY,
            .action = {
                .type = BINDING_BUILTIN,
                .data.builtin = COMMAND_LEFT_WINK,
            },
        },
    },
    .two = {
        .state = HIGH,
        .aux = {
            .button_type = AUX_MOMENTARY,
            .action = {
                .type = BINDING_BUILTIN,
                .data.builtin = COMMAND_RIGHT_WINK,
            },
        },
    },
};

static void configure_aux_gpio(uint8_t enabled) {
    if (esp_sleep_get_wakeup_cause() != ESP_SLEEP_WAKEUP_UNDEFINED) {
        rtc_gpio_deinit(AUX_ONE_INPUT);
        rtc_gpio_deinit(AUX_TWO_INPUT);
    }

    if (enabled == AUX_ENABLED) {
        gpio_config_t conf = {
            .intr_type = GPIO_INTR_DISABLE,
            .mode = GPIO_MODE_INPUT,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .pull_up_en = GPIO_PULLUP_DISABLE,
            .pin_bit_mask = (1ULL << AUX_ONE_INPUT) | (1ULL << AUX_TWO_INPUT),
        };
        gpio_config(&conf);
    } else {
        gpio_reset_pin(AUX_ONE_INPUT);
        gpio_reset_pin(AUX_TWO_INPUT);
    }
}

void init_aux() {
    aux_lock = xSemaphoreCreateMutex();

    uint8_t cold_boot = (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED);
    if (cold_boot)
        load_nvs_aux_config(&aux_buttons);

    configure_aux_gpio(aux_buttons.status);

    if (cold_boot && aux_buttons.status == AUX_ENABLED) {
        aux_buttons.one.state = (uint8_t)gpio_get_level(AUX_ONE_INPUT);
        aux_buttons.two.state = (uint8_t)gpio_get_level(AUX_TWO_INPUT);
    }
}

void reload_aux() {
    xSemaphoreTake(aux_lock, portMAX_DELAY);
    load_nvs_aux_config(&aux_buttons);
    configure_aux_gpio(aux_buttons.status);
    if (aux_buttons.status == AUX_ENABLED) {
        aux_buttons.one.state = (uint8_t)gpio_get_level(AUX_ONE_INPUT);
        aux_buttons.two.state = (uint8_t)gpio_get_level(AUX_TWO_INPUT);
    }
    xSemaphoreGive(aux_lock);
}

void set_aux_status(uint8_t status) {
    if (status > AUX_ENABLED)
        return;

    xSemaphoreTake(aux_lock, portMAX_DELAY);
    aux_buttons.status = status;
    configure_aux_gpio(status);
    if (status == AUX_ENABLED) {
        aux_buttons.one.state = (uint8_t)gpio_get_level(AUX_ONE_INPUT);
        aux_buttons.two.state = (uint8_t)gpio_get_level(AUX_TWO_INPUT);
    }
    set_nvs_aux_status(status);
    xSemaphoreGive(aux_lock);

    if (status == AUX_ENABLED) {
        if (aux_one_task_handle != NULL)
            xTaskNotifyGive(aux_one_task_handle);
        if (aux_two_task_handle != NULL)
            xTaskNotifyGive(aux_two_task_handle);
    }

    BLE_LOGI(TAG, "Aux status: %s", aux_status_to_str((aux_status_t)status));
}

uint8_t get_aux_status() {
    return aux_buttons.status;
}

uint8_t validate_aux(aux_button_t* aux, size_t size) {

    if (aux == NULL)
        return 0;

    if (size < MIN_AUX_PAYLOAD_LEN || size > MAX_AUX_PAYLOAD_LEN) {
        BLE_LOGD(TAG, "Invalid aux payload size: %u", (unsigned int)size);
        return 0;
    }

    if (aux->button_type > AUX_MOMENTARY) {
        BLE_LOGD(TAG, "Invalid aux button type: %u", aux->button_type);
        return 0;
    }

    if (aux->action.type > BINDING_SETTING) {
        BLE_LOGD(TAG, "Invalid aux binding type: %u", aux->action.type);
        return 0;
    }

    size_t action_size = size - AUX_TYPE_LEN;
    uint8_t cmd_val_res = 0;

    if (aux->action.type == BINDING_CUSTOM_SEQUENCE) {
        cmd_val_res = validate_custom_command(&(aux->action.data.custom), (action_size - BINDING_TYP_LEN));
    } else if (aux->action.type == BINDING_BUILTIN) {
        if ((action_size == (BINDING_TYP_LEN + sizeof(command_t))) && (aux->action.data.builtin >= COMMAND_BOTH_UP) && (aux->action.data.builtin <= COMMAND_SLEEPY_EYE))
            cmd_val_res = 1;
        else
            BLE_LOGD(TAG, "Invalid builtin cmd: 0x%02X (size=%u)", aux->action.data.builtin, (unsigned int)action_size);
    } else if (aux->action.type == BINDING_SETTING) {
        // TODO: Validate setting toggle payload once defined
        cmd_val_res = 1;
    }

    return cmd_val_res;
}

// assumes valid input (from validate above)
void update_aux(aux_side_t side, aux_button_t* aux) {
    if (aux == NULL || side > TWO)
        return;

    if (aux->action.type == BINDING_NONE) {
        delete_aux(side);
        return;
    }

    xSemaphoreTake(aux_lock, portMAX_DELAY);
    if (side == ONE)
        aux_buttons.one.aux = *aux;
    else if (side == TWO)
        aux_buttons.two.aux = *aux;

    set_nvs_aux_binding(aux, side);
    xSemaphoreGive(aux_lock);

    BLE_LOGD(TAG, "Aux %s saved (%s, %s)", aux_side_to_str(side), aux_type_to_str(aux->button_type), binding_type_to_str(aux->action.type));
}

void get_aux(aux_side_t side, aux_button_t* aux) {
    if (aux == NULL)
        return;

    if (side > TWO) {
        memset(aux, 0, sizeof(aux_button_t));
        aux->button_type = AUX_MOMENTARY;
        aux->action.type = BINDING_NONE;
        return;
    }

    xSemaphoreTake(aux_lock, portMAX_DELAY);
    *aux = (side == ONE) ? aux_buttons.one.aux : aux_buttons.two.aux;
    xSemaphoreGive(aux_lock);
}

void delete_aux(aux_side_t side) {
    if (side > TWO)
        return;

    xSemaphoreTake(aux_lock, portMAX_DELAY);
    aux_button_t* target = (side == ONE) ? &aux_buttons.one.aux : &aux_buttons.two.aux;
    memset(target, 0, sizeof(aux_button_t));
    target->button_type = AUX_MOMENTARY;
    target->action.type = BINDING_NONE;

    delete_nvs_aux_binding(side);
    xSemaphoreGive(aux_lock);

    BLE_LOGD(TAG, "Aux %s deleted", aux_side_to_str(side));
}


static void process_aux_side(aux_side_t side, gpio_num_t pin, aux_button_state_t* btn_state) {
    uint8_t level = (uint8_t)gpio_get_level(pin);
    if (level == btn_state->state)
        return;

    btn_state->state = level;

    aux_button_t aux_cfg;
    xSemaphoreTake(aux_lock, portMAX_DELAY);
    aux_cfg = btn_state->aux;
    xSemaphoreGive(aux_lock);

    BLE_LOGV(TAG, "%s edge %s (%s)", aux_side_to_str(side), level == LOW ? "LOW" : "HIGH", aux_type_to_str(aux_cfg.button_type));

    // LOW = pressed ==> latched ON
    if (level == LOW) {
        if (get_custom_command_executing()) {
            BLE_LOGI(TAG, "%s ON -> cancelling active sequence", aux_side_to_str(side));
            request_command_cancellation();
            return;
        }

        if (aux_cfg.action.type == BINDING_BUILTIN) {
            BLE_LOGI(TAG, "%s ON -> %s", aux_side_to_str(side), command_to_str((command_types_t)aux_cfg.action.data.builtin));
            xQueueSend(command_output_queue, &aux_cfg.action.data.builtin, 0);
        } else if (aux_cfg.action.type == BINDING_CUSTOM_SEQUENCE) {
            BLE_LOGI(TAG, "%s ON -> CUSTOM_SEQUENCE (len=%u, loop=%u)", aux_side_to_str(side), aux_cfg.action.data.custom.sequence_length, aux_cfg.action.data.custom.looping);
            request_command_submission(&aux_cfg.action.data.custom);
        } else if (aux_cfg.action.type == BINDING_SETTING) {
            BLE_LOGI(TAG, "%s ON -> SETTING toggle", aux_side_to_str(side));
            // TODO: Call setting toggle function
        } else {
            BLE_LOGD(TAG, "%s ON -> NONE (unbound)", aux_side_to_str(side));
        }
    } else {
        // HIGH = released ==> unlatched OFF
        if (aux_cfg.button_type == AUX_LATCHING) {
            if (aux_cfg.action.type == BINDING_SETTING) {
                BLE_LOGI(TAG, "%s OFF (LATCHING) -> SETTING toggle", aux_side_to_str(side));
                // TODO: Call setting toggle function
            } else if (get_custom_command_executing()) {
                BLE_LOGI(TAG, "%s OFF (LATCHING) -> cancelling active sequence", aux_side_to_str(side));
                request_command_cancellation();
            }
        }
    }
}

void aux_one_input_task(void* args) {
    for (;;) {
        if (aux_buttons.status == AUX_DISABLED) {
            ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
            continue;
        }

        process_aux_side(ONE, AUX_ONE_INPUT, &aux_buttons.one);
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

void aux_two_input_task(void* args) {
    for (;;) {
        if (aux_buttons.status == AUX_DISABLED) {
            ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
            continue;
        }

        process_aux_side(TWO, AUX_TWO_INPUT, &aux_buttons.two);
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}
