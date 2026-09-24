#include <FreeRTOSConfig.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>

#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"

QueueHandle_t output_queue;
RTC_DATA_ATTR headlight_position_t positions = {
    .left_pos = UNKNOWN_POSITION,
    .right_pos = UNKNOWN_POSITION,
    .last_left_move_dir = UNKNOWN_POSITION,
    .last_right_move_dir = UNKNOWN_POSITION,
};

void outputs_init()
{
    const gpio_config_t output_config = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pin_bit_mask = (1UL << OUT_PIN_LEFT_DOWN | 1UL << OUT_PIN_LEFT_UP | 1UL << OUT_PIN_RIGHT_DOWN | 1UL << OUT_PIN_RIGHT_UP),
    };
    // init output gpio and send all pins low to start
    gpio_config(&output_config);
    gpio_set_level(OUT_PIN_LEFT_DOWN, LOW);
    gpio_set_level(OUT_PIN_LEFT_UP, LOW);
    gpio_set_level(OUT_PIN_RIGHT_DOWN, LOW);
    gpio_set_level(OUT_PIN_RIGHT_UP, LOW);
}

void output_queue_init()
{
    output_queue = xQueueCreate(1, sizeof(movement_target_t));
}

void start_side_move(MOVE_TYPE left, MOVE_TYPE right)
{
    if (left == UP && positions.left_pos < 100)
    {
        gpio_set_level(OUT_PIN_LEFT_UP, HIGH);
        gpio_set_level(OUT_PIN_LEFT_DOWN, LOW);
    }
    else if (left == DOWN && positions.left_pos > 0)
    {
        gpio_set_level(OUT_PIN_LEFT_DOWN, HIGH);
        gpio_set_level(OUT_PIN_LEFT_UP, LOW);
    }

    if (right == UP && positions.right_pos < 100)
    {
        gpio_set_level(OUT_PIN_LEFT_UP, HIGH);
        gpio_set_level(OUT_PIN_LEFT_DOWN, LOW);
    }
    else if (right == DOWN && positions.right_pos > 0)
    {
        gpio_set_level(OUT_PIN_LEFT_DOWN, HIGH);
        gpio_set_level(OUT_PIN_LEFT_UP, LOW);
    }
}


void handle_output_task()
{
    for (;;)
    {
        movement_target_t target;
        if (xQueueReceive(output_queue, &target, portMAX_DELAY))
        {
            // TODO: Handle sleepy eye
            // NOTE: If only a single sides status is SLEEPY_EYE
            // it is guarenteed (not LITERALLY, but by the APP)
            // that the other headlight will be a NOP and not a UP/DOWN

            // starts movement by assigning pins high/low
            // assumes UP/DOWN at this point
            // clear stopped bits
            xEventGroupClearBits(movement_event, LEFT_STOPPED_BIT | RIGHT_STOPPED_BIT);
            start_side_move(target.left_target, target.right_target);

            // wait for bits on headlights that are moving
            const EventBits_t bits_to_wait = (target.left_target != NOP ? LEFT_STOPPED_BIT : 0x0) | (target.right_target != NOP ? RIGHT_STOPPED_BIT : 0x0);
            // TODO: this should eventually probably not be portMAX_DELAY (max allowed move time... 1000ms?)
            xEventGroupWaitBits(movement_event, bits_to_wait, pdFALSE, pdTRUE, portMAX_DELAY);

            // notify command task that movement finished
            // todo: probably eventually will want a more ... insightful type
            // of notification. for example, if the above wait times out?
            xTaskNotifyGive(command_output_task);
        }
    }
}
headlight_position_t get_position()
{
    return positions;
}