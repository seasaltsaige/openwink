#ifndef __QUEUE_HANDLER
#define __QUEUE_HANDLER

#include "freertos/FreeRTOS.h"

extern QueueHandle_t button_queue;
extern QueueHandle_t headlight_input_queue;
extern QueueHandle_t headlight_output_queue;

void INIT_queues();

#endif