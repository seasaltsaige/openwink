#include "../../include/handler/queue_handler.h"

#include "freertos/FreeRTOS.h"

QueueHandle_t QueueHandler::button_queue = xQueueCreate(10, sizeof(int));
QueueHandle_t QueueHandler::headlight_input_queue = xQueueCreate(10, sizeof(bool));
QueueHandle_t QueueHandler::headlight_output_queue = xQueueCreate(10, sizeof(uint8_t));