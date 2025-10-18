#include "common.h"
#include "freertos/FreeRTOS.h"

QueueHandle_t button_queue = xQueueCreate(10, sizeof(bool));
// Theoretically should not be larger than one at any given time, as that is just how the headlight status wire works
QueueHandle_t headlight_queue = xQueueCreate(3, sizeof(bool));
QueueHandle_t headlight_output_queue = xQueueCreate(10, sizeof(int));