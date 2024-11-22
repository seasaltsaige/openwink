#include "NimBLEDevice.h"
#include <Arduino.h>
#include "constants.h"
#include "BLECallbacks.h"
#include "BLE.h"
#include "MainFunctions.h"
#include "esp_sleep.h"
#include "Storage.h"

void ServerCallbacks::onConnect(NimBLEServer* pServer) {
  deviceConnected = true;
  WinkduinoBLE::updateHeadlightChars();
  printf("Client connected:: %s\n", connInfo.getAddress().toString().c_str());
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer) {

  Storage::setCustomButtonPressArrayDefaults(customButtonPressArray);

  Storage::setDelay(maxTimeBetween_ms)

  deviceConnected = false;
  awakeTime_ms = 0;

  printf("Disconnected from client\n");

  WinkduinoBLE::start();
}

void LongTermSleepCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
  printf("long term sleep written\n");
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

  int buttonInp = digitalRead(UP_BUTTON_INPUT);
  if (buttonInp == 1)
    esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 0);
  else if (buttonInp == 0)
    esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 1);

  delay(100);
  esp_deep_sleep_start();
}

void SyncCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
  if (leftStatus > 1) {
    double valFromTop = (double)(leftStatus - 10) / 100;
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    delay(HEADLIGHT_MOVEMENT_DELAY * valFromTop);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
  } else if (leftStatus == 0) {
    leftUp();
  }

  leftStatus = 1;
  setAllOff();
  WinkduinoBLE::updateHeadlightChars();

  if (rightStatus > 1) {
    double valFromTop = (double)(rightStatus - 10) / 100;
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    delay(HEADLIGHT_MOVEMENT_DELAY * valFromTop);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  } else if (rightStatus == 0) {
    rightUp();
  }

  rightStatus = 1;
  setAllOff();
  WinkduinoBLE::updateHeadlightChars();
}

void LeftSleepCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
  std::string value = pChar->getValue();
  int headlightValue = String(value.c_str()).toInt();
  double percentage = ((double)headlightValue) / 100;

  // Client blocks this endpoint when headlights are already sleepy

  if (leftStatus == 1) {
    leftDown();
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();
  }

  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  delay(percentage * HEADLIGHT_MOVEMENT_DELAY);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  leftStatus = headlightValue + 10;
  WinkduinoBLE::updateHeadlightChars();
}

void RightSleepCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
  std::string value = pChar->getValue();
  int headlightValue = String(value.c_str()).toInt();
  double percentage = ((double)headlightValue) / 100;

  // Client blocks this endpoint when headlights are already sleepy
  if (rightStatus == 1) {
    rightDown();
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();
  }

  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  delay(percentage * HEADLIGHT_MOVEMENT_DELAY);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  rightStatus = headlightValue + 10;
  WinkduinoBLE::updateHeadlightChars();
}

void RequestCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
  std::string value = pChar->getValue();
  int valueInt = String(value.c_str()).toInt();

  WinkduinoBLE::setBusy(true);

  switch (valueInt) {
    // Both Up
    case 1:
      bothUp();
      break;

    // Both Down
    case 2:
      bothDown();
      break;
    // Both Blink
    case 3:
      // Should function regardless of current headlight position (ie: Left is up, right is down -> Blink Command -> Left Down Left Up AND Right Up Right Down)
      bothBlink();
      break;

    // Left Up
    case 4:
      leftUp();
      break;

    // Left Down
    case 5:
      leftDown();
      break;

    // Left Blink (Wink)
    case 6:
      leftWink();
      break;

    // Right Up
    case 7:
      rightUp();
      break;

    // Right Down
    case 8:
      rightDown();
      break;

    // Right Blink (Wink)
    case 9:
      rightWink();
      break;

    // "Wave" left first
    case 10:

      if (leftStatus != rightStatus) {
        bothUp();
        delay(HEADLIGHT_MOVEMENT_DELAY);
        setAllOff();
        WinkduinoBLE::updateHeadlightChars();
      }

      leftWave();
      break;

    case 11:

      if (leftStatus != rightStatus) {
        bothUp();
        delay(HEADLIGHT_MOVEMENT_DELAY);
        setAllOff();
        WinkduinoBLE::updateHeadlightChars();
      }

      rightWave();

      break;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  setAllOff();

  WinkduinoBLE::updateHeadlightChars();
  WinkduinoBLE::setBusy(false);
}

void HeadlightCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
  string val = pChar->getValue();

  double multi = stod(val) / 100.0;
  Storage::setHeadlightMulti(multi);
  headlightMultiplier = multi;
}

void CustomButtonPressCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
}

void OTAUpdateCharacteristicCallbacks::onRead(NimBLECharacteristic* pChar) {
}

void AdvertisingCallbacks::onRead(NimBLECharacteristic* pChar) {
}
