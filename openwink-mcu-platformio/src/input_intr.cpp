#include "input_intr.h"
#include "../include/common.h"
#include "gpio_conf.h"
#include "handler/queue.h"

#include "driver/gpio.h"
#include "esp_intr_types.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"

void button_intr_fn(void* params)
{
    // cursed asf
    gpio_num_t button_input = static_cast<gpio_num_t>((int)params);
    int inter = gpio_get_level(button_input);
    xQueueSendFromISR(QueueHandler::button_queue, &inter, NULL);
}

void headlight_status_intr_fn(void* params)
{
}

void INIT_button_intr()
{
    esp_err_t err = gpio_isr_handler_add(BUTTON_INPUT, &button_intr_fn, (void*)BUTTON_INPUT);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Button Input interrupt callback function");
    }
    ESP_LOGI("INTR", "Set up button intr");
}

void INIT_headlight_status_intr()
{

    esp_err_t err = gpio_isr_handler_add(HEADLIGHT_STATUS, &headlight_status_intr_fn, (void*)HEADLIGHT_STATUS);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Headlight Status Input interrupt callback function");
    }
}

void INIT_intr()
{
    esp_err_t err = gpio_install_isr_service(ESP_INTR_FLAG_SHARED);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error interrupt service");
    }

    INIT_button_intr();
    INIT_headlight_status_intr();
}