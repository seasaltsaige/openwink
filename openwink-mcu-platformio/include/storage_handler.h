#ifndef STORAGE_HANDLER_H
#define STORAGE_HANDLER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#include "button_bindings.h"

#ifdef __cplusplus
extern "C" {
#endif

void init_nvs_storage();

// used to check if module has already been paired
uint8_t device_nvs_key_exists();
void set_nvs_device_key(uint8_t* data, size_t size);
void get_nvs_device_key(uint8_t* data, size_t size);
void delete_nvs_device_key();

// button config/binding helpers
void set_nvs_button_status(uint8_t status);
void get_nvs_button_status(uint8_t* status);
void set_nvs_button_delay(uint16_t delay);
void get_nvs_button_delay(uint16_t* delay);
void set_nvs_binding(const button_binding_t* binding, uint8_t pos);
void get_nvs_binding(button_binding_t* binding, uint8_t pos);
void delete_nvs_binding(uint8_t pos);
void load_nvs_button_config(button_config_t* config);

int8_t get_nvs_seeded();
void seed_nvs_defaults();

#ifdef __cplusplus
}
#endif

#endif