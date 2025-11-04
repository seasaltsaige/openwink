#include "handler/queue.h"
#include "globals.h"

#include "freertos/FreeRTOS.h"

void INIT_queues()
{
    button_queue = xQueueCreate(10, sizeof(int));
    headlight_input_queue = xQueueCreate(10, sizeof(bool));
    headlight_output_queue = xQueueCreate(10, sizeof(int));
}