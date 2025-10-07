#include "esp32-hal-gpio.h"
#include <Arduino.h>
#include "ButtonHandler.h"
#include "BLE.h"
#include "Storage.h"
#include "constants.h"
#include "BLECallbacks.h"
#include "MainFunctions.h"

using namespace std;

RTC_DATA_ATTR int initialButton = -1;
int motionButtonStatus = 0;
unsigned long motionTimer = 0;

unsigned long ButtonHandler::mainTimer;
unsigned long ButtonHandler::buttonTimer;
unsigned long ButtonHandler::resetTimer;
int ButtonHandler::buttonPressCounter;
int ButtonHandler::resetPressCounter;
bool ButtonHandler::customCommandActive;
bool ButtonHandler::resetArmed;

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

// If OEM Button Pressed while custom command is active
void ButtonHandler::loopCustomCommandInterruptHandler() {
  if (!ButtonHandler::customCommandActive) return;
  // Send interrupt command; 0 = turn command off.
  ButtonHandler::setCustomCommandActive(false);
  BLE::setCustomStatus(0);
}

void ButtonHandler::setCustomCommandActive(bool value) {
  ButtonHandler::customCommandActive = value;
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
      leftWink();
      break;

    case 4:
      rightWink();
      break;

    case 5:
      rightWink();
      rightWink();
      break;

    case 6:
      bothBlink();
      break;

    case 7:
      bothBlink();
      bothBlink();
      break;

    case 8:
      leftWave();
      break;

    case 9:
      rightWave();
      break;
  }

  setAllOff();

  BLE::updateHeadlightChars();
  BLE::setBusy(false);
}


void ButtonHandler::handleCustomSequence(int buttonInput) {


  if (buttonPressCounter == 0 && buttonInput != initialButton) {
    buttonPressCounter = 1;
    initialButton = buttonInput;
    buttonTimer = millis();
    return;
  }

  if (buttonPressCounter > 0) {

    if ((millis() - buttonTimer) > maxTimeBetween_ms) {
      handleButtonPressesResponse(buttonPressCounter - 1);
      // buttonTimer = millis();
      buttonPressCounter = 0;
      return;
    }

    if (buttonInput != initialButton) {
      buttonPressCounter++;
      initialButton = buttonInput;

      if (buttonPressCounter == 10) {
        // Limit Reached - Only 10 items in array
        handleButtonPressesResponse(9);
        buttonPressCounter = 0;
        return;
      }

      // reaches item in array not set (set to 0) means previous key is last set item
      if (customButtonPressArray[buttonPressCounter - 1] == 0) {
        // - 2 due to the fact that say, array is { 5, 3, 2, 8, 0, 0, 0, 0, 0, 0 };
        // button presses is equal to 5. [buttonPressCounter - 1] gives position 4 (which is 0). 
        // to get last entry that is not 0, must be buttonPressCounter - 2, which is 8
        handleButtonPressesResponse(buttonPressCounter - 2);
        buttonPressCounter = 0;
        return;
      }
    }

  }
}

void ButtonHandler::handleDefaultBehavior(int buttonInput) {
  if (buttonInput != initialButton) {
    BLE::setBusy(true);
    initialButton = buttonInput;

    if (buttonInput == 1) {
      bothUp();
    } else {
      bothDown();
    }

    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();

    BLE::setBusy(false);
    BLE::updateHeadlightChars();
  }
}

void ButtonHandler::loopButtonHandler() {

  int buttonInput = digitalRead(OEM_BUTTON_INPUT);

  if (buttonInput != initialButton && awakeTime_ms == 0) {
    awakeTime_ms = 5 * 1000 * 60;
  }

  if (buttonInput != initialButton) {
    ButtonHandler::loopCustomCommandInterruptHandler();
  }


  if (customButtonStatusEnabled) {
    handleCustomSequence(buttonInput);
  } else {
    handleDefaultBehavior(buttonInput);
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


void ButtonHandler::handleResetLogic() {
  if (resetPressCounter == 0 && initialButton != LOW) return;

  int buttonValue = digitalRead(OEM_BUTTON_INPUT);
  if (buttonValue == initialButton) return;
  // TODO: Decide if unnecessary or not. Potentially sequence to arm, then maybe 5 presses in a row or something to confirm. (any delay withing 30 seconds total)
  resetArmed = true;
  // Initial Press (must be low state)
  if (resetPressCounter == 0) {
    Serial.println("Reset Press 1.");
    resetTimer = millis();
    resetPressCounter++;
  } else {
    // presss 2, and 3
    if (resetPressCounter < 3 && (millis() - resetTimer) > 3500 && (millis() - resetTimer) < 6500) {
      Serial.printf("Reset Press %d.\n", resetPressCounter + 1);
      resetTimer = millis();
      resetPressCounter++;
      // last press 4
    } else if (resetPressCounter == 3 && (millis() - resetTimer) > 5500 && (millis() - resetTimer) < 8500) {
      // Reset activated
      Serial.printf("Reset Press %d.\n", resetPressCounter + 1);
      Storage::clearWhitelist();
      NimBLEDevice::deleteAllBonds();
      // reset sequence to visually indicate reset success
      leftWink();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();

      rightWink();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();

      bothBlink();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();

      Serial.printf("RESET BONDED DEVICE. GOING TO SLEEP.\n");

      // reset wakeup sources
      esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
      // enable sleep timer
      esp_sleep_enable_timer_wakeup(sleepTime_us);

      int buttonInput = digitalRead(OEM_BUTTON_INPUT);
      // enable gpio wakeup, depending on current state
      if (buttonInput == 1)
        esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 0);
      else if (buttonInput == 0)
        esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 1);

      Serial.println("Entering deep sleep from reset. Wake with gpio input/timer...");
      esp_deep_sleep_start();

    } else {
      // Something pressed incorrectly (timing perhaps) resets reset sequence.
      resetTimer = 0;
      resetPressCounter = 0;
      resetArmed = false;
    }
  }
}
