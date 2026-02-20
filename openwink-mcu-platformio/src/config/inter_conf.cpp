#include "config/inter_conf.h"
#include "handler/input.h"
#include <esp_log.h>
#include <esp_timer.h>
#include <freertos/FreeRTOS.h>


// TODO: Reaslistically, this should just be polled in a task, easier for debounce logic
//       and polling every ms is almost nothing
void button_interrupt(void* params)
{
    // Set event time and gpio level
    ButtonEvent buttonTime = {
        .event_time = esp_timer_get_time(),
        .button_level = gpio_get_level(Settings::BUTTON_INPUT) == 1 ? HIGH : LOW,
    };

    BaseType_t hasWokenPriority = pdFALSE;
    xQueueSendFromISR(button_queue, &buttonTime, &hasWokenPriority);
    portYIELD_FROM_ISR(hasWokenPriority);
}

void INIT_inter()
{

    esp_err_t err = gpio_install_isr_service(ESP_INTR_FLAG_SHARED);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error interrupt service");
    }


    err = gpio_isr_handler_add(Settings::BUTTON_INPUT, &button_interrupt, NULL);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Button Input interrupt callback function");
    }
    ESP_LOGI("INTR", "Set up button intr");
}
