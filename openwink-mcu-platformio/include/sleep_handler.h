#ifndef SLEEP_HANDLER_H
#define SLEEP_HANDLER_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <stdint.h>

#define SLEEP_TIME_US (15ULL * 1000ULL * 1000ULL)
#define ADVERTISE_TIME_MS 750
#define BUTTON_AWAKE_TIME_MS (5UL * 60UL * 1000UL)

#ifdef __cplusplus
extern "C" {
#endif

void init_sleep_handler();
void notify_sleep_button_activity();
void reset_sleep_timer_on_advertising();
void reset_sleep_on_disconnect();
void configure_wakeup_sources(uint8_t enable_timer);
void sleep_task(void* args);

#ifdef __cplusplus
}
#endif

#endif
