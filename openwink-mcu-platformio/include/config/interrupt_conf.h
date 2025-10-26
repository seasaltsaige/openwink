#ifndef __BUTTON_INTR
#define __BUTTON_INTR

#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>
#include <freertos/FreeRTOSConfig.h>

void INIT_intr();

void INIT_button_intr();
void INIT_headlight_status_intr();

#endif