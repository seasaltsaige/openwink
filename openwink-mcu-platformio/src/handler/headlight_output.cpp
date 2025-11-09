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

RTC_DATA_ATTR bool HeadlightOutputHandler::custom_button = false;
RTC_DATA_ATTR int HeadlightOutputHandler::max_time_button_press_ms = 500;
RTC_DATA_ATTR double HeadlightOutputHandler::wave_delay = 0.33;

RTC_DATA_ATTR double HeadlightOutputHandler::rightSleepyEye = 50;
RTC_DATA_ATTR double HeadlightOutputHandler::leftSleepyEye = 50;

void HeadlightOutputHandler::set_pins_low()
{
    gpio_set_level(LEFT_DOWN_OUT, LEVEL::LOW);
    gpio_set_level(LEFT_UP_OUT, LEVEL::LOW);
    gpio_set_level(RIGHT_DOWN_OUT, LEVEL::LOW);
    gpio_set_level(RIGHT_UP_OUT, LEVEL::LOW);
}

void HeadlightOutputHandler::wave(WAVE_START_SIDE start_side)
{
    // Logic to decide if headlights are starting down or up, saying which way to move initially
    bool moving_up = HeadlightStatus::left == LEVEL::LOW && HeadlightStatus::right == LEVEL::LOW;

    // Two part delay, calculate 2nd part based on first
    double secondary_wave_delay = 1.0 - wave_delay;

    // Helper function to send headlights high/low
    auto move_headlight = [&](gpio_num_t up_pin, gpio_num_t down_pin, bool move_up)
    {
        gpio_set_level(up_pin, move_up ? LEVEL::HIGH : LEVEL::LOW);
        gpio_set_level(down_pin, move_up ? LEVEL::LOW : LEVEL::HIGH);
    };

    // Helper function to stop headlights/turn pins off
    auto stop_headlight = [&](gpio_num_t up_pin, gpio_num_t down_pin)
    {
        gpio_set_level(up_pin, LEVEL::LOW);
        gpio_set_level(down_pin, LEVEL::LOW);
    };

    // Generalized headlight pins, depending on which side is the starting side
    gpio_num_t first_up = start_side == WAVE_START_SIDE::LEFT ? LEFT_UP_OUT : RIGHT_UP_OUT;
    gpio_num_t first_down = start_side == WAVE_START_SIDE::LEFT ? LEFT_DOWN_OUT : RIGHT_DOWN_OUT;
    gpio_num_t second_up = start_side == WAVE_START_SIDE::LEFT ? RIGHT_UP_OUT : LEFT_UP_OUT;
    gpio_num_t second_down = start_side == WAVE_START_SIDE::LEFT ? RIGHT_DOWN_OUT : LEFT_DOWN_OUT;

    // Generalized status variables, allowing cleaner modification of either, depending on start side
    int& first_side_status = start_side == WAVE_START_SIDE::LEFT ? HeadlightStatus::left : HeadlightStatus::right;
    int& second_side_status = start_side == WAVE_START_SIDE::LEFT ? HeadlightStatus::right : HeadlightStatus::left;

    // Begin moving first headlight down/up
    move_headlight(first_up, first_down, moving_up);
    vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms * wave_delay));

    // Begin moving second headlight down/up
    move_headlight(second_up, second_down, moving_up);
    vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms * secondary_wave_delay));

    // First headlight all the way to goal state, update status + begin opposite movement
    first_side_status = moving_up ? LEVEL::HIGH : LEVEL::LOW;
    BLE::updateHeadlightStatus();
    stop_headlight(first_up, first_down);

    move_headlight(first_up, first_down, !moving_up);
    vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms * wave_delay));

    // Second headlight all the way to goal state, update status + begin opposite movement
    second_side_status = moving_up ? LEVEL::HIGH : LEVEL::LOW;
    BLE::updateHeadlightStatus();
    stop_headlight(second_up, second_down);

    move_headlight(second_up, second_down, !moving_up);
    vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms * secondary_wave_delay));

    // First headlight now returned to original position, update status + delay until second headlight in original position
    first_side_status = moving_up ? LEVEL::LOW : LEVEL::HIGH;
    BLE::updateHeadlightStatus();
    stop_headlight(first_up, first_down);

    vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms * wave_delay));
    second_side_status = moving_up ? LEVEL::LOW : LEVEL::HIGH;
    BLE::updateHeadlightStatus();

    set_pins_low();
}

void HeadlightOutputHandler::send_command(HEADLIGHT_COMMAND command)
{
    BLE::setHeadlightsBusy(true);

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

            BLE::updateHeadlightStatus();
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

            BLE::updateHeadlightStatus();
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

        BLE::updateHeadlightStatus();

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

        BLE::updateHeadlightStatus();

        break;

    case HEADLIGHT_COMMAND::LEFT_UP:
        if (HeadlightStatus::left == LEVEL::HIGH)
            break;

        gpio_set_level(LEFT_UP_OUT, LEVEL::HIGH);
        HeadlightStatus::left = 1;
        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();

        BLE::updateHeadlightStatus();
        break;

    case HEADLIGHT_COMMAND::LEFT_DOWN:
        if (HeadlightStatus::left == LEVEL::LOW)
            break;

        gpio_set_level(LEFT_DOWN_OUT, LEVEL::HIGH);
        HeadlightStatus::left = 0;
        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();

        BLE::updateHeadlightStatus();
        break;

    case HEADLIGHT_COMMAND::LEFT_WINK:
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


        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();
        BLE::updateHeadlightStatus();

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

        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();
        BLE::updateHeadlightStatus();

        break;

    case HEADLIGHT_COMMAND::RIGHT_UP:
        if (HeadlightStatus::right == LEVEL::HIGH)
            break;
        gpio_set_level(RIGHT_UP_OUT, LEVEL::HIGH);
        HeadlightStatus::right = 1;
        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();

        BLE::updateHeadlightStatus();
        break;
    case HEADLIGHT_COMMAND::RIGHT_DOWN:
        if (HeadlightStatus::right == LEVEL::LOW)
            break;

        gpio_set_level(RIGHT_DOWN_OUT, LEVEL::HIGH);
        HeadlightStatus::right = 0;
        vTaskDelay(pdMS_TO_TICKS(HeadlightInputHandler::headlight_delay_ms));
        set_pins_low();

        BLE::updateHeadlightStatus();
        break;
    case HEADLIGHT_COMMAND::RIGHT_WINK:

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
        BLE::updateHeadlightStatus();

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
        BLE::updateHeadlightStatus();

        break;

    case HEADLIGHT_COMMAND::WAVE_LEFT: wave(WAVE_START_SIDE::LEFT); break;

    case HEADLIGHT_COMMAND::WAVE_RIGHT: wave(WAVE_START_SIDE::RIGHT); break;

    default: ESP_LOGE("COMMAND", "Invalid command received"); break;
    }


    BLE::setHeadlightsBusy(false);
}