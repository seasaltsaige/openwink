#include "handler/headlight_output.h"
#include "ble/ble.h"
#include "globals.h"
#include "handler/headlight_input.h"


#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"


// TODO: NOTIFY BLE HEADLIGHT STATUS/BUSY CHARS

int HeadlightOutputHandler::HeadlightStatus::left = 0;
int HeadlightOutputHandler::HeadlightStatus::right = 0;

void HeadlightOutputHandler::set_pins_low()
{
    gpio_set_level(LEFT_DOWN_OUT, LEVEL::LOW);
    gpio_set_level(LEFT_UP_OUT, LEVEL::LOW);
    gpio_set_level(RIGHT_DOWN_OUT, LEVEL::LOW);
    gpio_set_level(RIGHT_UP_OUT, LEVEL::LOW);
}

void HeadlightOutputHandler::send_command(HEADLIGHT_COMMAND command)
{
    switch (command)
    {
    case HEADLIGHT_COMMAND::BOTH_UP:
        if (HeadlightStatus::left != LEVEL::HIGH || HeadlightStatus::right != LEVEL::HIGH)
        {
            gpio_set_level(LEFT_UP_OUT, LEVEL::HIGH);
            gpio_set_level(RIGHT_UP_OUT, LEVEL::HIGH);

            vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));

            set_pins_low();
            HeadlightStatus::left = 1;
            HeadlightStatus::right = 1;
        }

        break;
    case HEADLIGHT_COMMAND::BOTH_DOWN:
        if (HeadlightStatus::left != LEVEL::LOW || HeadlightStatus::right != LEVEL::LOW)
        {
            gpio_set_level(LEFT_DOWN_OUT, LEVEL::HIGH);
            gpio_set_level(RIGHT_DOWN_OUT, LEVEL::HIGH);

            vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));

            set_pins_low();
            HeadlightStatus::left = 0;
            HeadlightStatus::right = 0;
        }

        break;
    case HEADLIGHT_COMMAND::BOTH_BLINK:
        if (HeadlightStatus::left == LEVEL::LOW)
        {
            gpio_set_level(LEFT_UP_OUT, LEVEL::HIGH);
            HeadlightStatus::left = 1;
        }
        else
        {
            gpio_set_level(LEFT_DOWN_OUT, LEVEL::HIGH);
            HeadlightStatus::left = 0;
        }

        if (HeadlightStatus::right == LEVEL::LOW)
        {
            gpio_set_level(RIGHT_UP_OUT, LEVEL::HIGH);
            HeadlightStatus::right = 1;
        }
        else
        {
            gpio_set_level(RIGHT_DOWN_OUT, LEVEL::HIGH);
            HeadlightStatus::right = 0;
        }

        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();

        if (HeadlightStatus::left == LEVEL::LOW)
        {
            gpio_set_level(LEFT_UP_OUT, LEVEL::HIGH);
            HeadlightStatus::left = 1;
        }
        else
        {
            gpio_set_level(LEFT_DOWN_OUT, LEVEL::HIGH);
            HeadlightStatus::left = 0;
        }

        if (HeadlightStatus::right == LEVEL::LOW)
        {
            gpio_set_level(RIGHT_UP_OUT, LEVEL::HIGH);
            HeadlightStatus::right = 1;
        }
        else
        {
            gpio_set_level(RIGHT_DOWN_OUT, LEVEL::HIGH);
            HeadlightStatus::right = 0;
        }

        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();

        break;

    case HEADLIGHT_COMMAND::LEFT_UP: break;
    case HEADLIGHT_COMMAND::LEFT_DOWN: break;
    case HEADLIGHT_COMMAND::LEFT_WINK: break;

    case HEADLIGHT_COMMAND::RIGHT_UP: break;
    case HEADLIGHT_COMMAND::RIGHT_DOWN: break;
    case HEADLIGHT_COMMAND::RIGHT_WINK: break;

    case HEADLIGHT_COMMAND::WAVE_LEFT: break;

    case HEADLIGHT_COMMAND::WAVE_RIGHT: break;

    default: ESP_LOGE("COMMAND", "Invalid command received"); break;
    }
}