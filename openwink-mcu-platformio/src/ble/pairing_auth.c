#include <esp_random.h>
#include <esp_timer.h>
#include <string.h>

#include "ble/ble_handler.h"
#include "ble/pairing_auth.h"
#include "storage_handler.h"

TaskHandle_t auth_task_handle;
SemaphoreHandle_t auth_lock;
auth_state_t auth_state = AUTH_UNPAIRED;

static uint8_t active_key[AUTH_KEY_LEN];

static uint8_t pending_fail_flag = 0;
static uint8_t pending_ok_flag = 0;
static uint8_t client_subscribed = 0;
static uint8_t protocol_v2 = 0;
static uint8_t hello_received = 0;
static uint8_t challenge_sent = 0;
static uint8_t received_key[AUTH_KEY_LEN];
static int64_t auth_timer_us = 0;
static int64_t subscribe_time_us = 0;
static uint32_t auth_session_id = 0;

void init_auth() {
    auth_state = AUTH_UNPAIRED;
    auth_lock = xSemaphoreCreateMutex();
}

void set_auth_state(auth_state_t state) {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    auth_state = state;
    xSemaphoreGive(auth_lock);

    // Wake auth_task on any active state transition while connected
    if (state != AUTH_UNPAIRED && auth_task_handle != NULL && get_device_status() == CONNECTED)
        xTaskNotifyGive(auth_task_handle);
}

auth_state_t get_auth_state() {
    return auth_state;
}


void generate_token(uint8_t* data, size_t size) {
    if (data == NULL || size < 1)
        return;

    const char charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const uint8_t charset_size = sizeof(charset) - 1;
    // ensure all bytes are equally likely
    const uint8_t max_valid_byte = (256 / charset_size) * charset_size;// 248

    uint8_t bytes[64];
    size_t index = 0;
    while (index < size) {
        // fill bytes
        esp_fill_random(bytes, sizeof(bytes));

        for (uint8_t i = 0; i < sizeof(bytes) && index < size; i++) {
            if (bytes[i] < max_valid_byte) {
                data[index++] = charset[bytes[i] % charset_size];
            }
        }
    }
}

void begin_auth_on_connection() {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    auth_session_id++;
    pending_fail_flag = 0;
    pending_ok_flag = 0;
    client_subscribed = 0;
    protocol_v2 = 0;
    hello_received = 0;
    challenge_sent = 0;
    auth_timer_us = esp_timer_get_time();
    subscribe_time_us = 0;
    memset(active_key, 0, AUTH_KEY_LEN);
    memset(received_key, 0, AUTH_KEY_LEN);

    uint8_t paired = device_nvs_key_exists();
    if (paired) {
        // already paired, expecting client to send token
        get_nvs_device_key(active_key, AUTH_KEY_LEN);
        xSemaphoreGive(auth_lock);
        set_auth_state(AUTH_WAIT_TOK);
    } else {
        generate_token(active_key, AUTH_KEY_LEN);
        xSemaphoreGive(auth_lock);
        // Send token to client once subscribed
        set_auth_state(AUTH_SEND_TOK);
    }
}

void reset_auth_on_disconnect() {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    auth_session_id++;
    auth_state = AUTH_UNPAIRED;

    // clear keys
    memset(active_key, 0, AUTH_KEY_LEN);
    memset(received_key, 0, AUTH_KEY_LEN);

    // reset state management
    pending_fail_flag = 0;
    pending_ok_flag = 0;
    client_subscribed = 0;
    protocol_v2 = 0;
    hello_received = 0;
    challenge_sent = 0;
    auth_timer_us = 0;
    subscribe_time_us = 0;
    xSemaphoreGive(auth_lock);
}

void client_subscribed_auth() {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    client_subscribed = 1;
    if (subscribe_time_us == 0)
        subscribe_time_us = esp_timer_get_time();
    xSemaphoreGive(auth_lock);

    if (auth_task_handle != NULL)
        xTaskNotifyGive(auth_task_handle);
}


void handle_passkey_write(const uint8_t* data, uint16_t size) {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    if (auth_state != AUTH_WAIT_TOK && auth_state != AUTH_SEND_TOK && auth_state != AUTH_WAIT_ECHO) {
        xSemaphoreGive(auth_lock);
        return;
    }

    // Client hello: opts into v2 explicit challenge/confirmation packets
    if (data != NULL && size == 1 && data[0] == AUTH_PKT_HELLO) {
        protocol_v2 = 1;
        hello_received = 1;
        // If legacy fallback offer had already transitioned to AUTH_WAIT_ECHO, re-arm v2 offer
        if (auth_state == AUTH_WAIT_ECHO) {
            auth_state = AUTH_SEND_TOK;
            challenge_sent = 0;
        }
        xSemaphoreGive(auth_lock);
        if (auth_task_handle != NULL)
            xTaskNotifyGive(auth_task_handle);
        return;
    }

    // clear data first
    memset(received_key, 0, AUTH_KEY_LEN);

    // Explicit client abort or key write received before unpaired offer was sent
    if (data == NULL || size < 1 || (size == 1 && data[0] == AUTH_PKT_ABORT) || auth_state == AUTH_SEND_TOK) {
        if (data != NULL && size == 1 && data[0] == AUTH_PKT_ABORT)
            protocol_v2 = 1;
        pending_fail_flag = 1;
        xSemaphoreGive(auth_lock);
        if (auth_task_handle != NULL)
            xTaskNotifyGive(auth_task_handle);
        return;
    }

    // v2 apps send [AUTH_PKT_KEY_DATA, <20B token>]; legacy apps send raw <20B token>
    uint8_t received_key_valid = 0;
    if (protocol_v2) {
        if (size == AUTH_KEY_PKT_LEN && data[0] == AUTH_PKT_KEY_DATA) {
            memcpy(received_key, &data[1], AUTH_KEY_LEN);
            received_key_valid = 1;
        }
    } else if (size == AUTH_KEY_LEN) {
        memcpy(received_key, data, AUTH_KEY_LEN);
        received_key_valid = 1;
    }

    uint8_t key_matches = (received_key_valid && active_key[0] != 0 && memcmp(active_key, received_key, AUTH_KEY_LEN) == 0);
    if (key_matches) {
        auth_state_t prev_state = auth_state;
        uint8_t use_v2_ok = protocol_v2;
        uint8_t key_to_persist[AUTH_KEY_LEN];
        memcpy(key_to_persist, active_key, AUTH_KEY_LEN);

        auth_state = AUTH_ESTABLISHED;
        pending_ok_flag = use_v2_ok ? 1 : 0;
        pending_fail_flag = 0;
        xSemaphoreGive(auth_lock);

        if (prev_state == AUTH_WAIT_ECHO)
            set_nvs_device_key(key_to_persist, AUTH_KEY_LEN);

        if (use_v2_ok && auth_task_handle != NULL)
            xTaskNotifyGive(auth_task_handle);
        return;
    }

    // Invalid key or malformed packet in AUTH_WAIT_TOK or AUTH_WAIT_ECHO
    pending_fail_flag = 1;
    xSemaphoreGive(auth_lock);
    if (auth_task_handle != NULL)
        xTaskNotifyGive(auth_task_handle);
}

static void fail_and_disconnect_session(uint32_t session, uint8_t notify_v2_fail) {
    if (notify_v2_fail && get_device_status() == CONNECTED) {
        uint8_t fail_pkt = AUTH_PKT_FAIL;
        ble_notify_passkey(&fail_pkt, sizeof(fail_pkt));
        vTaskDelay(pdMS_TO_TICKS(40));
    }

    xSemaphoreTake(auth_lock, portMAX_DELAY);
    uint8_t same_session = (auth_session_id == session && auth_state != AUTH_ESTABLISHED);
    if (same_session)
        auth_state = AUTH_UNPAIRED;
    xSemaphoreGive(auth_lock);

    if (same_session && get_device_status() == CONNECTED)
        ble_disconnect();
}

void auth_task(void* args) {
    for (;;) {
        xSemaphoreTake(auth_lock, portMAX_DELAY);
        uint8_t send_ok = pending_ok_flag;
        if (send_ok)
            pending_ok_flag = 0;
        uint32_t session = auth_session_id;
        auth_state_t state_snapshot = auth_state;
        xSemaphoreGive(auth_lock);

        if (send_ok && get_device_status() == CONNECTED) {
            // Allow ATT Write Response on PASSKEY_UUID to flush before notifying OK
            vTaskDelay(pdMS_TO_TICKS(10));
            xSemaphoreTake(auth_lock, portMAX_DELAY);
            uint8_t still_established = (auth_session_id == session && auth_state == AUTH_ESTABLISHED && protocol_v2);
            xSemaphoreGive(auth_lock);

            if (still_established && get_device_status() == CONNECTED) {
                uint8_t ok_pkt = AUTH_PKT_OK;
                ble_notify_passkey(&ok_pkt, sizeof(ok_pkt));
            }
        }

        if (state_snapshot == AUTH_ESTABLISHED || state_snapshot == AUTH_UNPAIRED) {
            ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
            continue;
        }

        // if there is a device connected and we have not been authorized yet
        if (get_device_status() == CONNECTED && state_snapshot != AUTH_ESTABLISHED) {
            uint8_t send_v2_need_key = 0;
            uint8_t send_v2_offer_key = 0;
            uint8_t send_legacy_offer_key = 0;
            uint8_t offer_pkt[AUTH_KEY_PKT_LEN];
            uint8_t legacy_offer[AUTH_KEY_LEN];
            int64_t now_us = esp_timer_get_time();

            xSemaphoreTake(auth_lock, portMAX_DELAY);
            session = auth_session_id;
            if (!challenge_sent && client_subscribed) {
                if (protocol_v2 && hello_received) {
                    if (auth_state == AUTH_WAIT_TOK) {
                        challenge_sent = 1;
                        auth_timer_us = now_us;
                        send_v2_need_key = 1;
                    } else if (auth_state == AUTH_SEND_TOK) {
                        challenge_sent = 1;
                        offer_pkt[0] = AUTH_PKT_OFFER_KEY;
                        memcpy(&offer_pkt[1], active_key, AUTH_KEY_LEN);
                        auth_timer_us = now_us;
                        auth_state = AUTH_WAIT_ECHO;
                        send_v2_offer_key = 1;
                    }
                } else if (!protocol_v2 && auth_state == AUTH_SEND_TOK && subscribe_time_us > 0 &&
                           (now_us - subscribe_time_us) >= (AUTH_LEGACY_OFFER_DELAY_MS * 1000)) {
                    // Legacy app connected to an unpaired module (did not send AUTH_PKT_HELLO):
                    // send raw 20-byte token without v2 header so legacy app can pair cleanly.
                    challenge_sent = 1;
                    memcpy(legacy_offer, active_key, AUTH_KEY_LEN);
                    auth_timer_us = now_us;
                    auth_state = AUTH_WAIT_ECHO;
                    send_legacy_offer_key = 1;
                }
            }
            xSemaphoreGive(auth_lock);

            if (send_v2_need_key) {
                uint8_t need_pkt = AUTH_PKT_NEED_KEY;
                ble_notify_passkey(&need_pkt, sizeof(need_pkt));
            } else if (send_v2_offer_key) {
                ble_notify_passkey(offer_pkt, sizeof(offer_pkt));
            } else if (send_legacy_offer_key) {
                ble_notify_passkey(legacy_offer, sizeof(legacy_offer));
            }

            xSemaphoreTake(auth_lock, portMAX_DELAY);
            uint8_t has_fail = pending_fail_flag;
            if (has_fail)
                pending_fail_flag = 0;
            uint8_t use_v2_fail = protocol_v2;
            int64_t start_time_us = auth_timer_us;
            auth_state_t curr_state = auth_state;
            session = auth_session_id;
            xSemaphoreGive(auth_lock);

            if (has_fail) {
                vTaskDelay(pdMS_TO_TICKS(10));
                fail_and_disconnect_session(session, use_v2_fail);
                continue;
            }

            int64_t elapsed_us = esp_timer_get_time() - start_time_us;

            if (curr_state != AUTH_ESTABLISHED && curr_state != AUTH_UNPAIRED && start_time_us > 0 &&
                ((curr_state != AUTH_WAIT_ECHO && elapsed_us >= (AUTH_INIT_TIMEOUT_MS * 1000)) ||
                 (curr_state == AUTH_WAIT_ECHO && elapsed_us >= (AUTH_ECHO_TIMEOUT_MS * 1000)))) {
                fail_and_disconnect_session(session, use_v2_fail);
                continue;
            }
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}