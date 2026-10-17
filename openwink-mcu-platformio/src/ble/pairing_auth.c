#include <esp_timer.h>

#include "ble/ble_handler.h"
#include "ble/pairing_auth.h"

TaskHandle_t auth_task_handle;
SemaphoreHandle_t pairing_lock;
pairing_state_t auth_state = AUTH_UNPAIRED;


void init_pairing() {
    auth_state = AUTH_UNPAIRED;
    pairing_lock = xSemaphoreCreateMutex();
}

void set_pairing_state(pairing_state_t state) {
    xSemaphoreTake(pairing_lock, portMAX_DELAY);
    auth_state = state;
    xSemaphoreGive(pairing_lock);

    // if entering a claim state while connected, wake the task
    if ((state != AUTH_UNPAIRED && state != AUTH_ESTABLISHED) && get_device_status() == CONNECTED)
        xTaskNotifyGive(auth_task_handle);
}

pairing_state_t get_pairing_state() {
    return auth_state;
}


void auth_task(void* args) {

    int64_t time;
    uint32_t val = 0;

    for (;;) {
        if (auth_state == AUTH_ESTABLISHED || auth_state == AUTH_UNPAIRED)
            val = ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        if (val != 0)
            time = esp_timer_get_time();


        if (get_device_status() == CONNECTED && auth_state != AUTH_ESTABLISHED) {
            if ((esp_timer_get_time() - time) >= (AUTH_TIMEOUT_MS * 1000)) {
                ble_disconnect();
                set_pairing_state(AUTH_UNPAIRED);
            }
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}