#ifndef __QUEUE_HANDLER
#define __QUEUE_HANDLER

#include "freertos/FreeRTOS.h"

class QueueHandler
{
  public:
    static QueueHandle_t button_queue;
    static QueueHandle_t headlight_input_queue;
    static QueueHandle_t headlight_output_queue;
};

#endif