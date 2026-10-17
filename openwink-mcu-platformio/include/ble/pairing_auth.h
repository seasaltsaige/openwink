#ifndef PAIRING_AUTH_H
#define PAIRING_AUTH_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#define AUTH_TIMEOUT_MS 5000

typedef enum PAIRING_STATE : uint8_t {
    AUTH_UNPAIRED,
    AUTH_WAIT_TOKEN,// token already exists in NVS, expecting app to alert

    AUTH_SEND_TOK,
    AUTH_WAIT_ECHO,// no token exists in NVS,

    AUTH_ESTABLISHED,
} pairing_state_t;

extern TaskHandle_t auth_task_handle;

#ifdef __cplusplus
extern "C" {
#endif

pairing_state_t get_pairing_state();
void set_pairing_state(pairing_state_t state);
void init_pairing();

void auth_task(void* args);

#ifdef __cplusplus
}
#endif

#endif