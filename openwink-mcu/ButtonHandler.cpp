#include "ButtonHandler.h"

#include <Arduino.h>

#include "BLE.h"
#include "BLECallbacks.h"
#include "MainFunctions.h"
#include <string>
#include "Storage.h"
#include "constants.h"
#include "esp32-hal-gpio.h"

using namespace std;

RTC_DATA_ATTR int initialButton = 0;
bool bypassHeadlightOverride = false;

int motionButtonStatus = 0;
unsigned long motionTimer = 0;

unsigned long ButtonHandler::mainTimer = 0;
unsigned long ButtonHandler::buttonTimer = 0;
unsigned long ButtonHandler::resetTimer = 0;
int ButtonHandler::buttonPressCounter = 0;
int ButtonHandler::resetPressCounter = 0;
bool ButtonHandler::customCommandActive = false;
bool ButtonHandler::resetArmed = false;

unsigned long debounceTimer = 0;
const int DEBOUNCE_MS = 50;
bool checkDebounce = false;
bool debounceOccurred = false;

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
    debounceTimer = millis();
    if ((wakeupValue != initialButton)) {
      buttonPressCounter++;
      buttonTimer = millis();
    }
  } else {
    if ((wakeupValue != initialButton)) {
      if (initialButton == 1)
        bothUp();
      else
        bothDown();
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
  string response = customButtonPressArray[numberOfPresses];

  // check length --> if length 1, parse to int and proceed with default things,
  // otherwise, will be modified custom command with guaranteed length of 2 or more,
  // thus sending to CommandHandler to parse and execute.

  Serial.printf("Executing preset with %d, presses\n", numberOfPresses);

  BLE::setBusy(true);

  if (response.length() == 1) {
    int parsed = stoi(response);
    switch (parsed) {
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
  } else 
    queuedCustomCommand = response;

  setAllOff();

  BLE::updateHeadlightChars();
  BLE::setBusy(false);
}

void ButtonHandler::loopButtonHandler() {
  int buttonInput = digitalRead(OEM_BUTTON_INPUT);

  if (buttonInput != initialButton) {
    // every time button is pressed, reset mainTimer to allow sleep to function
    // correctly
    mainTimer = millis();
    ButtonHandler::loopCustomCommandInterruptHandler();
  }

  // Small pulse occurred --- THIS MEANS HEADLIGHTS ARE *ON*. THIS IS ONE PRESS
  if (checkDebounce && (buttonInput != initialButton) && (millis() - debounceTimer) <= DEBOUNCE_MS) {
    if (!bypassHeadlightOverride) {
      Serial.println("Bypass not enabled");
      checkDebounce = false;
      debounceOccurred = false;
      buttonPressCounter = 0;
      return;
    }

    debounceOccurred = true;

    Serial.println("Debounce occurred");
    // if custom button turned on
    if (customButtonStatusEnabled) {
      // add to counter
      buttonPressCounter++;

      // if counter reaches array limit, execute last one
      if (buttonPressCounter == 10) {
        // Limit Reached - Only 10 items in array
        handleButtonPressesResponse(9);
        buttonPressCounter = 0;
        // otherwise, if a 0 is seen, execute the one before it.
      } else if (customButtonPressArray[buttonPressCounter - 1] == "0") {
        handleButtonPressesResponse(buttonPressCounter - 2);
        buttonPressCounter = 0;
      }
    }
    initialButton = buttonInput;
    // since debounce just happened, state would need to switch again for this
    // to recheck.
    checkDebounce = false;
    return;
  }

  // if button input changes, set debounce timer and return
  if (buttonInput != initialButton) {
    Serial.println("Inputs differ");
    debounceTimer = millis();
    // button timer gets set every press (only affects non-headlight on /
    // no-debounce state)
    buttonTimer = millis();
    // Set check for next loop through, debounce has not occurred yet, but need
    // to check (if inputs differ when timer < 50ms)
    debounceOccurred = false;
    checkDebounce = true;
  }

  // IF debounce time has passed
  if ((!debounceOccurred && checkDebounce) && (millis() - debounceTimer) > DEBOUNCE_MS) {
    // no longer need to check debounce
    checkDebounce = false;
    Serial.println("Past debounce timer");
    // checkDebounce being true means that button was pressed previously
    if (customButtonStatusEnabled) {
      // add to counter
      buttonPressCounter++;
      if (buttonPressCounter == 10) {
        // Limit Reached - Only 10 items in array
        handleButtonPressesResponse(9);
        buttonPressCounter = 0;
      } else if (customButtonPressArray[buttonPressCounter - 1] == "0") {
        handleButtonPressesResponse(buttonPressCounter - 2);
        buttonPressCounter = 0;
      }
    } else {
      if (initialButton == 0) {
        bothDown();
      } else {
        bothUp();
      }
      setAllOff();
      initialButton = !initialButton;
    }

    // if button has been pressed at least one time, and wait time has exceeded
    // max, execute action
  } else if (buttonPressCounter > 0 && customButtonStatusEnabled && (millis() - buttonTimer) > maxTimeBetween_ms) {
    Serial.println("Past timer... executing command");
    // Timeout has occurred, send command based on count
    handleButtonPressesResponse(buttonPressCounter - 1);
    buttonPressCounter = 0;
  }

  initialButton = buttonInput;
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
      // BLE::setMotionInValue((int)timeOn + 25);
    }
  }
}

void ButtonHandler::updateButtonSleep() {
  if (!BLE::getDeviceConnected() && (millis() - mainTimer) > advertiseTime_ms && (millis() - mainTimer) > awakeTime_ms) {
    int buttonInput = digitalRead(OEM_BUTTON_INPUT);

    if (buttonInput == 1)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 0);
    else if (buttonInput == 0)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 1);

    Serial.println("Entering deep sleep...");

    if (!BLE::getDeviceConnected()) esp_deep_sleep_start();
  }
}

void ButtonHandler::handleResetLogic() {
  if (resetPressCounter == 0 && initialButton != LOW) return;

  int buttonValue = digitalRead(OEM_BUTTON_INPUT);
  if (buttonValue == initialButton) return;
  // TODO: Decide if unnecessary or not. Potentially sequence to arm, then maybe
  // 5 presses in a row or something to confirm. (any delay withing 30 seconds
  // total)
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

      Serial.println(
        "Entering deep sleep from reset. Wake with gpio input/timer...");
      esp_deep_sleep_start();

    } else {
      // Something pressed incorrectly (timing perhaps) resets reset sequence.
      resetTimer = 0;
      resetPressCounter = 0;
      resetArmed = false;
    }
  }
}
