#include "esp32-hal-gpio.h"
#include <Arduino.h>
#include "ButtonHandler.h"
#include "BLE.h"
#include "constants.h"
#include "BLECallbacks.h"
#include "MainFunctions.h"

using namespace std;

RTC_DATA_ATTR int initialButton = -1;
int motionButtonStatus = 0;
unsigned long motionTimer = 0;

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
  pinMode(OEM_BUTTON_INPUT, INPUT);
  pinMode(OEM_HEADLIGHT_STATUS, INPUT);
}

void ButtonHandler::readOnWakeup() {

  int wakeupValue = initialButton;
  initialButton = digitalRead(OEM_BUTTON_INPUT);

  if (customButtonStatusEnabled) {
    mainTimer = millis();
    if ((wakeupValue != initialButton)) {
      buttonPressCounter++;
      buttonTimer = millis();
    }
  } else {
    if ((wakeupValue != initialButton)) {
      if (initialButton == 1) bothUp();
      else bothDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
    }
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

  BLE::setBusy(true);

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

  BLE::updateHeadlightChars();
  BLE::setBusy(false);
}


void ButtonHandler::loopButtonHandler() {

  int buttonInput = digitalRead(OEM_BUTTON_INPUT);

  if (buttonInput != initialButton && awakeTime_ms == 0)
    awakeTime_ms = 5 * 1000 * 60;

  if (customButtonStatusEnabled) {

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
  } else {
    int button = digitalRead(OEM_BUTTON_INPUT);
    if (button != initialButton) {
      BLE::setBusy(true);
      initialButton = button;

      if (button == 1) {
        digitalWrite(OUT_PIN_LEFT_UP, HIGH);
        digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

        delay(HEADLIGHT_MOVEMENT_DELAY);

        digitalWrite(OUT_PIN_LEFT_UP, LOW);
        digitalWrite(OUT_PIN_RIGHT_UP, LOW);

      } else {
        digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
        digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);

        delay(HEADLIGHT_MOVEMENT_DELAY);

        digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
        digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
      }

      BLE::setBusy(false);
      BLE::updateHeadlightChars();
    }
  }
}


void ButtonHandler::handleBusyInput() {

  int readStatus = digitalRead(OEM_HEADLIGHT_STATUS);
  if (readStatus != motionButtonStatus) {
    motionButtonStatus = readStatus;

    if (readStatus == 1) {
      // Start timer to measure on time
      motionTimer = millis();
      Serial.printf("Timer started...\n");
    } else {
      unsigned long current = millis();

      unsigned long timeOn = current - motionTimer;

      // TODO: Set in storage if different
      // Set RTC DATA ATTR var value
      // Send notification for app to update value
      BLE::setMotionInValue((int)timeOn + 25);
    }
  }
}

void ButtonHandler::updateButtonSleep() {

  if (
    !BLE::getDeviceConnected() && (millis() - mainTimer) > advertiseTime_ms && (millis() - mainTimer) > awakeTime_ms) {
    int buttonInput = digitalRead(OEM_BUTTON_INPUT);

    if (buttonInput == 1)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 0);
    else if (buttonInput == 0)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 1);

    Serial.println("Entering deep sleep...");

    if (!BLE::getDeviceConnected())
      esp_deep_sleep_start();
  }
}
