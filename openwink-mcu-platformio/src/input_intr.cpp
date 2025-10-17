#include "input_intr.h"
#include "common.h"
#include "gpio_conf.h"

#include "driver/gpio.h"
#include "esp_log.h"

void button_intr_fn(void *params)
{
}

void headlight_status_intr_fn(void *params)
{
}

void INIT_button_intr()
{
    esp_err_t err = gpio_install_isr_service(BUTTON_INPUT);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Button Input interrupt");
    }

    err = gpio_isr_handler_add(BUTTON_INPUT, &button_intr_fn, (void *)BUTTON_INPUT);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Button Input interrupt callback function");
    }
}

void INIT_headlight_status_intr()
{
    esp_err_t err = gpio_install_isr_service(HEADLIGHT_STATUS);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Headlight Status Input interrupt");
    }

    err = gpio_isr_handler_add(HEADLIGHT_STATUS, &headlight_status_intr_fn, (void *)HEADLIGHT_STATUS);
    if (err != ESP_OK)
    {
        ESP_LOGE("INTR", "Error initiallizing Headlight Status Input interrupt callback function");
    }
}

void INIT_intr()
{
    INIT_button_intr();
    INIT_headlight_status_intr();
}