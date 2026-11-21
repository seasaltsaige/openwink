#ifndef PAIRING_AUTH_H
#define PAIRING_AUTH_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#define AUTH_INIT_TIMEOUT_MS 5000
#define AUTH_ECHO_TIMEOUT_MS 5000
#define AUTH_LEGACY_OFFER_DELAY_MS 300

#define AUTH_KEY_LEN (uint8_t)20

// Handshake packet opcodes on PASSKEY_UUID
// App -> MCU writes:
//   [AUTH_PKT_HELLO] (1B, opts into explicit v2 handshake)
//   [AUTH_PKT_KEY_DATA, <20B token>] (21B)
//   [AUTH_PKT_ABORT] (1B)
//   (Legacy <v2 apps write raw <20B token> without sending AUTH_PKT_HELLO)
// MCU -> App notifications (when v2 opted in via AUTH_PKT_HELLO):
//   [AUTH_PKT_NEED_KEY] (1B)
//   [AUTH_PKT_OFFER_KEY, <20B token>] (21B)
//   [AUTH_PKT_OK] (1B)
//   [AUTH_PKT_FAIL] (1B)
#define AUTH_PKT_HELLO (uint8_t)0x00
#define AUTH_PKT_NEED_KEY (uint8_t)0x01
#define AUTH_PKT_OFFER_KEY (uint8_t)0x02
#define AUTH_PKT_OK (uint8_t)0x03
#define AUTH_PKT_FAIL (uint8_t)0xFF

#define AUTH_PKT_KEY_DATA (uint8_t)0x01
#define AUTH_PKT_ABORT (uint8_t)0xFF
#define AUTH_KEY_PKT_LEN (1 + AUTH_KEY_LEN)

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
