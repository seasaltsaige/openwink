#ifndef STORAGE_HANDLER_H
#define STORAGE_HANDLER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>

#ifdef __cplusplus
extern "C" {
#endif

void init_nvs_storage();

// used to check if module has already been paired
uint8_t device_key_exists();
void set_device_key(uint8_t* data, size_t size);
void get_device_key(uint8_t* data, size_t size);
void delete_device_key();

#ifdef __cplusplus
}
#endif

#endif