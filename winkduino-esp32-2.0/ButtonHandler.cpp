#include "esp32-hal-gpio.h"
#include <Arduino.h>
#include "ButtonHandler.h"
#include "BLE.h"
#include "constants.h"
#include "BLECallbacks.h"
#include "MainFunctions.h"
#include "WifiUpdateServer.h"

using namespace std;

RTC_DATA_ATTR int initialButton = -1;

unsigned long ButtonHandler::mainTimer;
unsigned long ButtonHandler::buttonTimer;
int ButtonHandler::buttonPressCounter;


void ButtonHandler::setupGPIO() {
  // Outputs for headlight movement
  pinMode(OUT_PIN_LEFT_DOWN, OUTPUT);
  pinMode(OUT_PIN_LEFT_UP, OUTPUT);
  pinMode(OUT_PIN_RIGHT_DOWN, OUTPUT);
  pinMode(OUT_PIN_RIGHT_UP, OUTPUT);
  // OEM Wiring inputs to detect initial state of headlights
  pinMode(OEM_BUTTON_INPUT, INPUT_PULLUP);
}

void ButtonHandler::readOnWakeup() {
  mainTimer = millis();
  int wakeupValue = initialButton;
  initialButton = digitalRead(OEM_BUTTON_INPUT);

  if (wakeupValue != -1 && (wakeupValue != initialButton)) {
    buttonPressCounter++;
    buttonTimer = millis();
  }
}

void ButtonHandler::readWakeUpReason() {
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0)
    awakeTime_ms = 5 * 1000 * 60;
  else
    awakeTime_ms = 0;
}

void ButtonHandler::handleButtonPressesResponse(int numberOfPresses) {
  // Uses above array of items
  int response = customButtonPressArray[numberOfPresses];

  WinkduinoBLE::setBusy(true);

  switch (response) {
    case 1:
      if (initialButton == 1) {
        bothUp();
      } else if (initialButton == 0) {
        bothDown();
      }

      rightStatus = initialButton;
      leftStatus = initialButton;
      break;

    case 2:
      leftWink();
      break;

    case 3:
      leftWink();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      leftWink();
      break;

    case 4:
      rightWink();
      break;

    case 5:
      rightWink();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      rightWink();
      break;

    case 6:
      bothBlink();
      break;

    case 7:
      bothBlink();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      bothBlink();
      break;

    case 8:
      leftWave();
      break;

    case 9:
      rightWave();
      break;
  }

  delay(HEADLIGHT_MOVEMENT_DELAY);
  setAllOff();

  WinkduinoBLE::updateHeadlightChars();
  WinkduinoBLE::setBusy(false);
}


void ButtonHandler::loopButtonHandler() {

  int buttonInput = digitalRead(OEM_BUTTON_INPUT);
  if (buttonPressCounter == 0 && buttonInput != initialButton) {

    buttonPressCounter++;
    initialButton = buttonInput;
    buttonTimer = millis();

  } else if (buttonPressCounter > 0) {
    if ((millis() - buttonTimer) > maxTimeBetween_ms) {
      // Execute button value
      handleButtonPressesResponse(buttonPressCounter - 1);
      buttonPressCounter = 0;
    } else {

      int buttonRead = digitalRead(OEM_BUTTON_INPUT);
      if (buttonRead != initialButton) {
        buttonPressCounter++;
        initialButton = buttonRead;

        if (buttonPressCounter == 11) {
          // Execute last one (has 10 total loaded)
          handleButtonPressesResponse(9);
          buttonPressCounter = 0;
        } else if (customButtonPressArray[buttonPressCounter - 1] == 0) {
          // Execute last one (reached last loaded value)
          handleButtonPressesResponse(buttonPressCounter - 2);
          buttonPressCounter = 0;
        }
        buttonTimer = millis();
      }
    }
  }
}


void ButtonHandler::updateButtonSleep() {

  if (
    !WifiUpdateServer::getDeviceConnected() && (millis() - mainTimer) > advertiseTime_ms && (millis() - mainTimer) > awakeTime_ms) {
    int buttonInput = digitalRead(OEM_BUTTON_INPUT);

    if (buttonInput == 1)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 0);
    else if (buttonInput == 0)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 1);

    if (!WifiUpdateServer::getDeviceConnected())
      esp_deep_sleep_start();
  }
}
