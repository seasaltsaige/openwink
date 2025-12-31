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
int ButtonHandler::buttonPressCounter = 0;
bool ButtonHandler::customCommandActive = false;
bool ButtonHandler::resetArmed = false;

bool ButtonHandler::isSleepyCommand = false;
bool ButtonHandler::commandRunning = false;

bool ButtonHandler::leftMoving = false;
bool ButtonHandler::rightMoving = false;

unsigned long ButtonHandler::leftTimer = 0;
unsigned long ButtonHandler::rightTimer = 0;

int ButtonHandler::leftMoveTime = HEADLIGHT_MOVEMENT_DELAY;
int ButtonHandler::rightMoveTime = HEADLIGHT_MOVEMENT_DELAY;


unsigned long debounceTimer = 0;
const int DEBOUNCE_MS = 35;
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
  // Headlight feedback pins
  pinMode(OEM_HEADLIGHT_STATUS_RIGHT, INPUT);
  pinMode(OEM_HEADLIGHT_STATUS_LEFT, INPUT);
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
      Serial.printf("Wakeup button press: %d\n", buttonPressCounter);
      buttonTimer = millis();
      debounceTimer = millis();
    }
  } else {
    Serial.printf("Custom not enabled\n");
    if ((wakeupValue != initialButton)) {
      buttonPressCounter++;
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

  if (customButtonPressArray[numberOfPresses] == "0" && numberOfPresses != 11 && numberOfPresses != 19) {
    for (int i = 0; i < 9; i++) {
      if (customButtonPressArray[i] == "0") {
        numberOfPresses = i - 1;
        break;
      }
    }
    if (numberOfPresses >= 9) numberOfPresses = 8;
  }

  // Uses above array of items
  string response = customButtonPressArray[numberOfPresses];

  // check length --> if length 1, parse to int and proceed with default things,
  // otherwise, will be modified custom command with guaranteed length of 2 or more,
  // thus sending to CommandHandler to parse and execute.

  Serial.printf("Executing preset with %d, presses\n", numberOfPresses);
  Serial.printf("Preset Value: %s\n", response.c_str());

  if (response == "10") {
    if (isSleepy())
      sleepyReset(true, true);
    else
      sleepyEye(true, true);

    return;
  } else if (response == "12") {
    bool swap = Storage::getHeadlightOrientation();
    Storage::setHeadlightOrientation(!swap);
    BLE::setSwapStatus(!swap);
    BLE::setBusy(true);
    leftWink();
    setAllOff();
    BLE::setBusy(false);

    return;
  } else if (response == "20") {

    Storage::reset();

    // reset sequence to visually indicate reset success
    leftWink();
    setAllOff();
    rightWink();
    setAllOff();
    bothBlink();
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

    return;
  }

  if (response.length() == 1) {
    int parsed = stoi(response);
    bool wasSleepy = false;
    if (isSleepy()) {
      sleepyReset(true, true);
      if (parsed != 1)
        wasSleepy = true;
    }

    BLE::setBusy(true);

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

      // TODO: If in sleepy eye, exit, execute, re-enter SAME WITH OTHER WAYS OF EXECUTING COMMANDS
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

    if (wasSleepy)
      sleepyEye(true, true);
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
  if (checkDebounce && (buttonInput != initialButton) && (millis() - buttonTimer) <= DEBOUNCE_MS) {
    if (!bypassHeadlightOverride) {
      Serial.println("Bypass not enabled");
      checkDebounce = false;
      debounceOccurred = false;
      buttonPressCounter = 0;
      return;
    }

    debounceOccurred = true;

    Serial.println("Debounce occurred");
    buttonPressCounter++;
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
  if ((!debounceOccurred && checkDebounce) && (millis() - buttonTimer) > DEBOUNCE_MS) {
    // no longer need to check debounce
    checkDebounce = false;
    Serial.println("Past debounce timer");
    // checkDebounce being true means that button was pressed previously
    if (customButtonStatusEnabled) {
      // add to counter
      buttonPressCounter++;
    } else {
      buttonPressCounter++;
      if (initialButton == 0) {
        bothDown();
      } else {
        bothUp();
      }
      setAllOff();
      initialButton = !initialButton;
    }

    Serial.printf("Press Count: %d\n", buttonPressCounter);

    // if button has been pressed at least one time, and wait time has exceeded
    // max, execute action
  } else if (buttonPressCounter > 0 && (millis() - buttonTimer) > maxTimeBetween_ms) {
    Serial.println("Past timer... executing command");
    // Timeout has occurred, send command based on count

    if (customButtonStatusEnabled || (!customButtonStatusEnabled && (buttonPressCounter == 12 || buttonPressCounter == 20)))
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