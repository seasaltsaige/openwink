#include "handler/queue.h"
#include "globals.h"

#include "freertos/FreeRTOS.h"

QueueHandle_t button_queue = xQueueCreate(10, sizeof(int));
QueueHandle_t headlight_input_queue = xQueueCreate(10, sizeof(bool));
QueueHandle_t headlight_output_queue = xQueueCreate(10, sizeof(int));