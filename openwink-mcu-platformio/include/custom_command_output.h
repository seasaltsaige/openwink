#ifndef CUSTOM_COMMAND_OUTPUT_H
#define CUSTOM_COMMAND_OUTPUT_H

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>

#define LOOPING_BIT (1UL << 8);
#define NOTIFY_BUTTON_INTERRUPT_BIT (1UL << 0)

// #define MAX_CUSTOM_COMMAND_LENGTH
// 3 byte delays
// 0xDE 0xEE 0x02 ==> Delay(0xDE) 0x02EE == 750ms Delay
#define DELAY_PREFIX 0xDE

// Max ATT MTU for IOS = 185 bytes, yielding a payload size of 182 bytes
// Include looping bit? so realistically 181 / 3?
#define MAX_SEQUENCE_LENGTH (181 / 3)// absolute max of 60 delay slots
// includes 1 byte of flags (looping)
// and 1 byte indicating sequence length
#define CUSTOM_CMD_HEADER_LENGTH 2

typedef struct
{
    uint8_t looping;
    uint8_t sequence_length;
    uint8_t sequence[MAX_SEQUENCE_LENGTH];
} custom_command_data_t;


extern TaskHandle_t custom_command_task_handle;
extern QueueHandle_t custom_command_queue_handle;

void init_custom_command_queue();

uint8_t get_custom_command_executing();

void custom_command_task();

#endif