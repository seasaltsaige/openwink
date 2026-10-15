#ifndef CUSTOM_COMMAND_OUTPUT_H
#define CUSTOM_COMMAND_OUTPUT_H

#include "command_output.h"

#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>

#define LOOPING_BIT (1UL << 8)
#define NOTIFY_BUTTON_INTERRUPT_BIT (1UL << 0)

// Sleepy prefix - 3 byte sleepy commands
// 0xBB 0x4D 0xFF ==> Sleepy, Left = 77%, Right = Unchanged
// 0xBB 0x64 0x64 ==> Sleepy, Both = 100%
#define SLEEPY_PREFIX 0xBB
#define SLEEPY_COMMAND_POS_UNCHANGED 0xFF
// simple mins and max for sleepy eye heights
// heights will be absolute, and taken with reference to current pos
// its really not the custom command parsers job to worry about though
#define SLEEPY_MAX 0x64
#define SLEEPY_MIN 0x00

// 3 byte delays
// 0xDE 0xEE 0x02 ==> Delay(0xDE) 0x02EE == 750ms Delay
#define DELAY_PREFIX 0xDE

// Max ATT MTU for IOS = 185 bytes, yielding a payload size of 182 bytes
// Include looping bit? so realistically 181 / 3?
// yeah i think 1 byte at the start will be 0 or 1 for looping, set in struct
// 1 byte for length too? too confusing to parse it, just use 1 more byte (still 60 max len)
// then remaining 180 bytes are payload data
#define ATT_MTU (185)
#define LOOPING_BYTE_COUNT 1
#define PAYLOAD_SIZE_BYTE_COUNT 1
#define PAYLOAD_MAX ((ATT_MTU - LOOPING_BYTE_COUNT - PAYLOAD_SIZE_BYTE_COUNT) - 3)
#define MAX_SEQUENCE_LENGTH (PAYLOAD_MAX / 3)// absolute max of 60 delay slots
// includes 1 byte of flags (looping)
// and 1 byte indicating sequence length
#define CUSTOM_CMD_HEADER_LENGTH 2

typedef struct {
    uint8_t looping;                // 0 if not looped, 1 if it is (loops forever until interrupted)
    uint8_t sequence_length;        // max of 60, defines size of actual command sequence, not byte length
    command_t sequence[PAYLOAD_MAX];// sequence payload of command_out
} custom_command_data_t;


extern TaskHandle_t custom_command_task_handle;
extern QueueHandle_t custom_command_queue_handle;


BaseType_t request_command_submission(custom_command_data_t* cmd);
void request_command_cancellation();
void init_custom_command_queue();
uint8_t get_custom_command_executing();


void custom_command_task();

#endif