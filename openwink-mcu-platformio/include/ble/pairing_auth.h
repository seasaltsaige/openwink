#ifndef PAIRING_AUTH_H
#define PAIRING_AUTH_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#define AUTH_INIT_TIMEOUT_MS 2500
#define AUTH_ECHO_TIMEOUT_MS 750

#define AUTH_KEY_LEN (uint8_t)20

typedef enum PAIRING_STATE : uint8_t {
    AUTH_UNPAIRED,
    AUTH_WAIT_TOK,// token already exists in NVS, expecting app to alert

    AUTH_SEND_TOK,
    AUTH_WAIT_ECHO,// no token exists in NVS,

    AUTH_ESTABLISHED,
} auth_state_t;

extern TaskHandle_t auth_task_handle;

#ifdef __cplusplus
extern "C" {
#endif

void generate_token(uint8_t* data, size_t size);
auth_state_t get_auth_state();
void set_auth_state(auth_state_t state);
void init_auth();

void begin_auth_on_connection();
void reset_auth_on_disconnect();
void client_subscribed_auth();
void handle_passkey_write(const uint8_t* data, uint16_t size);

void auth_task(void* args);

#ifdef __cplusplus
}
#endif

#endif