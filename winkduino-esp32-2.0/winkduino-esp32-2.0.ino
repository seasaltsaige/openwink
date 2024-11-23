#include <string.h>
#include <Arduino.h>

#include "driver/rtc_io.h"
#include "driver/gpio.h"
#include "esp_ota_ops.h"
#include "esp_mac.h"

#include "constants.h"
#include "WifiUpdateServer.h"
#include "Storage.h"
#include "MainFunctions.h"
#include "BLE.h"
#include "ButtonHandler.h"
#include "BLECallbacks.h"

using namespace std;

const int customButtonPressArrayDefaults[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
const int maxTimeBetween_msDefault = 500;
const int sleepTime_us = 15 * 1000 * 1000;
const int advertiseTime_ms = 1000;

unsigned long t;
int pressCounter = 0;
unsigned long buttonTimer;

void setup() {
  Serial.begin(115200);

  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();

  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0)
    awakeTime_ms = 5 * 1000 * 60;
  else
    awakeTime_ms = 0;


  Storage::begin("oem-store");
  Storage::getFromStorage();

  // Might not be necessary since deep sleep is more or less a reboot
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

  // Outputs for headlight movement
  pinMode(OUT_PIN_LEFT_DOWN, OUTPUT);
  pinMode(OUT_PIN_LEFT_UP, OUTPUT);
  pinMode(OUT_PIN_RIGHT_DOWN, OUTPUT);
  pinMode(OUT_PIN_RIGHT_UP, OUTPUT);
  // OEM Wiring inputs to detect initial state of headlights
  pinMode(UP_BUTTON_INPUT, INPUT);

  setCpuFrequencyMhz(80);

  WinkduinoBLE::init("Winkduino");

  esp_sleep_enable_timer_wakeup(sleepTime_us);

  t = millis();
  int wakeupValue = initialButton;
  initialButton = digitalRead(UP_BUTTON_INPUT);

  if (wakeupValue != -1 && (wakeupValue != initialButton)) {
    pressCounter++;
    buttonTimer = millis();
  }

  printf("Version %s\n", FIRMWARE_VERSION);

  WinkduinoBLE::start();
}

bool advertising = true;

void loop() {

  if (WifiUpdateServer::getWifiStatus())
    WifiUpdateServer::handleHTTPClient();


  int buttonInput = digitalRead(UP_BUTTON_INPUT);
  if (pressCounter == 0 && buttonInput != initialButton) {
    pressCounter++;
    initialButton = buttonInput;
    buttonTimer = millis();
    printf("READ INPUT INIT\n");
  } else if (pressCounter > 0) {
    if ((millis() - buttonTimer) > maxTimeBetween_ms) {
      // Execute button value
      printf("Number of presses read: %d\n", pressCounter);
      handleButtonPresses(pressCounter - 1);

      pressCounter = 0;
    } else {
      int buttonRead = digitalRead(UP_BUTTON_INPUT);
      if (buttonRead != initialButton) {
        pressCounter++;
        initialButton = buttonRead;

        if (pressCounter == 11) {
          // Execute last one (has 10 total loaded)
          printf("REACHED MAX NUMBER!!\n");
          handleButtonPresses(9);
          pressCounter = 0;
        } else if (customButtonPressArray[pressCounter - 1] == 0) {
          // Execute last one (reached last loaded value)
          printf("REACHED LAST LOADED VALUE! Defaulting to %d\n", pressCounter - 1);
          handleButtonPresses(pressCounter - 2);
          pressCounter = 0;
        }
        buttonTimer = millis();
      }
    }
  }

  if (!deviceConnected && (millis() - t) > advertiseTime_ms && (millis() - t) > awakeTime_ms) {
    buttonInput = digitalRead(UP_BUTTON_INPUT);
    if (buttonInput == 1)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 0);
    else if (buttonInput == 0)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 1);
    if (deviceConnected)
      return;

    if (!deviceConnected) {
      printf("Deep Sleep Starting...\n");
      delay(100);
      esp_deep_sleep_start();
    }
  }
}

// Function to handle custom button press
void handleButtonPresses(int index) {
  // Uses above array of items
  int valueToExecute = customButtonPressArray[index];

  WinkduinoBLE::setBusy(true);

  switch (valueToExecute) {
      /**
    1 : Default (If UP, switch to DOWN; if DOWN, switch to UP)
    2 : Left Blink
    3 : Left Blink x2
    4 : Right Blink
    5 : Right Blink x2
    6 : Both Blink
    7 : Both Blink x2
    8 : Left Wave
    9 : Right Wave
   10 : ...
  **/
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
