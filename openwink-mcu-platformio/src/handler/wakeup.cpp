#include "handler/wakeup.h"
#include "config/gpio_conf.h"
#include "globals.h"


#include "esp_log.h"
#include "esp_sleep.h"

void INIT_wakeup_sources()
{
    esp_err_t err = esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
    if (err != ESP_OK)
        ESP_LOGE("WAKE", "Wakeup disable failed");

    int input_level = gpio_get_level(BUTTON_INPUT);
    err = esp_sleep_enable_ext0_wakeup(BUTTON_INPUT, input_level == 1 ? 0 : 1);
    if (err != ESP_OK)
        ESP_LOGE("WAKE", "GPIO Wakeup initialization failed");

    err = esp_sleep_enable_timer_wakeup(SLEEP_TIME_US);
    if (err != ESP_OK)
        ESP_LOGE("WAKE", "Timer Wakeup initialization failed");

    ESP_LOGI("WAKE", "Wake sources successfully set");
}

void INIT_wakeup_sources(bool disable_gpio, uint64_t sleep_time)
{
    if (!disable_gpio)
    {
        INIT_wakeup_sources();
    }
    else
    {
        esp_err_t err = esp_sleep_enable_timer_wakeup(sleep_time);
        if (err != ESP_OK)
            ESP_LOGE("WAKE", "Timer Wakeup initialization failed");

        ESP_LOGI("WAKE", "Wake source set");
    }
}