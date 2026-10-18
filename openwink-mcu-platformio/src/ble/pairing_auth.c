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

static uint8_t key_received_flag = 0;
static uint8_t received_key_valid = 0;
static uint8_t client_subscribed = 0;
static uint8_t received_key[AUTH_KEY_LEN];

void init_auth() {
    auth_state = AUTH_UNPAIRED;
    auth_lock = xSemaphoreCreateMutex();
}

void set_auth_state(auth_state_t state) {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    auth_state_t prev_state = auth_state;
    auth_state = state;
    xSemaphoreGive(auth_lock);

    // if entering a claim state from unpaired while connected, wake the task
    if ((state != AUTH_UNPAIRED && state != AUTH_ESTABLISHED && prev_state == AUTH_UNPAIRED) && get_device_status() == CONNECTED)
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
    key_received_flag = 0;
    received_key_valid = 0;
    client_subscribed = 0;
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
        // Send token to client
        set_auth_state(AUTH_SEND_TOK);
    }
}

void reset_auth_on_disconnect() {
    set_auth_state(AUTH_UNPAIRED);

    xSemaphoreTake(auth_lock, portMAX_DELAY);
    // clear keys
    memset(active_key, 0, AUTH_KEY_LEN);
    memset(received_key, 0, AUTH_KEY_LEN);

    // reset state management
    key_received_flag = 0;
    received_key_valid = 0;
    client_subscribed = 0;
    xSemaphoreGive(auth_lock);
}

void client_subscribed_auth() {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    client_subscribed = 1;
    xSemaphoreGive(auth_lock);
}


void handle_passkey_write(const uint8_t* data, uint16_t size) {
    xSemaphoreTake(auth_lock, portMAX_DELAY);
    // clear data first
    memset(received_key, 0, AUTH_KEY_LEN);

    // copy data to received key section for comparison only if length matches
    if (data != NULL && size == AUTH_KEY_LEN) {
        memcpy(received_key, data, AUTH_KEY_LEN);
        received_key_valid = 1;
    } else {
        received_key_valid = 0;
    }

    // alert task key has been written
    key_received_flag = 1;
    xSemaphoreGive(auth_lock);
}

void auth_task(void* args) {

    int64_t time;
    uint32_t val = 0;

    for (;;) {
        if (auth_state == AUTH_ESTABLISHED || auth_state == AUTH_UNPAIRED)
            val = ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        // if woken up from wait, start timeout
        if (val != 0) {
            time = esp_timer_get_time();
            val = 0;
        }

        // if there is a device connected and we have not been authorized yet
        if (get_device_status() == CONNECTED && auth_state != AUTH_ESTABLISHED) {

            xSemaphoreTake(auth_lock, portMAX_DELAY);
            uint8_t subscribed = client_subscribed;
            if (auth_state == AUTH_SEND_TOK && subscribed)
                client_subscribed = 0;
            xSemaphoreGive(auth_lock);

            // we are in send state, and client has now subscribed to notifications
            if (auth_state == AUTH_SEND_TOK && subscribed) {
                // notify client of token
                ble_notify_passkey(active_key, AUTH_KEY_LEN);
                // begin wait for token echo
                set_auth_state(AUTH_WAIT_ECHO);
                // reset timer to allow 5s for echo
                time = esp_timer_get_time();
            }

            xSemaphoreTake(auth_lock, portMAX_DELAY);
            uint8_t has_key = key_received_flag;
            uint8_t key_matches = 0;
            if (has_key) {
                key_received_flag = 0;
                key_matches = (received_key_valid && active_key[0] != 0 && memcmp(active_key, received_key, AUTH_KEY_LEN) == 0);
                received_key_valid = 0;
            }
            xSemaphoreGive(auth_lock);

            // we have received a key in some capacity
            if (has_key) {
                if (key_matches) {
                    // commit to nvs ONLY if an echo
                    if (auth_state == AUTH_WAIT_ECHO)
                        set_nvs_device_key(active_key, AUTH_KEY_LEN);

                    set_auth_state(AUTH_ESTABLISHED);
                    continue;
                } else {
                    ble_disconnect();
                    set_auth_state(AUTH_UNPAIRED);
                    continue;
                }
            }

            auth_state_t curr_state = get_auth_state();

            if ((curr_state != AUTH_WAIT_ECHO && (esp_timer_get_time() - time) >= (AUTH_INIT_TIMEOUT_MS * 1000)) ||
            (curr_state == AUTH_WAIT_ECHO && (esp_timer_get_time() - time) >= (AUTH_ECHO_TIMEOUT_MS * 1000))) {
                ble_disconnect();
                set_auth_state(AUTH_UNPAIRED);
            }
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}