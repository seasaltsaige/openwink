#include "esp32-hal-gpio.h"
#include "esp32-hal.h"
#include <string>
#include <vector>
#include "NimBLEDevice.h"
#include <Arduino.h>
#include <string.h>
#include "constants.h"
#include "BLECallbacks.h"
#include "BLE.h"
#include "MainFunctions.h"
#include "esp_sleep.h"
#include "Storage.h"

#include <WiFi.h>
#include <Update.h>
#include <WebServer.h>
#include <ESPmDNS.h>

#include "esp_ota_ops.h"

using namespace std;

RTC_DATA_ATTR double headlightMultiplier = 1.0;

RTC_DATA_ATTR int customButtonPressArray[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
RTC_DATA_ATTR int maxTimeBetween_ms = 500;
RTC_DATA_ATTR bool customButtonStatusEnabled = false;

WebServer server(80);
bool wifi_enabled = false;

void ServerCallbacks::onConnect(NimBLEServer* pServer) {
  printf("Client connected:: %s\n");
  WinkduinoBLE::setDeviceConnected(true);
  WinkduinoBLE::updateHeadlightChars();
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer) {
  WinkduinoBLE::setDeviceConnected(false);
  awakeTime_ms = 0;
  WinkduinoBLE::start();
}

void LongTermSleepCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  printf("long term sleep written\n");
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

  int buttonInp = digitalRead(OEM_BUTTON_INPUT);
  if (buttonInp == 1)
    esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 0);
  else if (buttonInp == 0)
    esp_sleep_enable_ext0_wakeup((gpio_num_t)OEM_BUTTON_INPUT, 1);

  delay(100);
  esp_deep_sleep_start();
}

// TODO: UPDATE TO SYNC BOTH HEADLIGHTS AT ONCE
void SyncCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
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

// Send sleep command
void SleepCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {

  // If not a full step (fully down or fully up) return; as it is already sleepy
  if ((leftStatus != 1 && leftStatus != 0) || (rightStatus != 1 && rightStatus != 0))
    return;

  double left = leftSleepyValue / 100;
  double right = rightSleepyValue / 100;

  if (leftStatus == 1 || rightStatus == 1) {
    bothDown();
    delay(HEADLIGHT_MOVEMENT_DELAY);
  }

  unsigned long initialTime = millis();

  bothUp();
  
  bool leftStatusReached = false;
  bool rightStatusReached = false;

  // Delay loop for both headlights
  while (!leftStatusReached && !rightStatusReached) {
    unsigned long timeElapsed = (millis() - initialTime);
    if (timeElapsed >= (left * HEADLIGHT_MOVEMENT_DELAY)) {
      leftStatusReached = true;
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
    }
    if (timeElapsed >= (right * HEADLIGHT_MOVEMENT_DELAY))
      rightStatusReached = true;
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  }
}

// Updates headlight status
void SleepSettingsCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();
  char* charCVal = value.c_str();
  
  char* left = strtok(charCVal, "-");
  char* right = strtok(NULL, "-");

  leftSleepyValue = stod(string(left));
  rightSleepyValue = stod(string(right));

  Storage::setSleepyValues(0, leftSleepyValue);
  Storage::setSleepyValues(1, rightSleepyValue);

}

// void LeftSleepCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
//   string value = pChar->getValue();
//   int headlightValue = String(value.c_str()).toInt();
//   double percentage = ((double)headlightValue) / 100;

//   // Client blocks this endpoint when headlights are already sleepy

//   if (leftStatus == 1) {
//     leftDown();
//     delay(HEADLIGHT_MOVEMENT_DELAY);
//     setAllOff();
//   }

//   digitalWrite(OUT_PIN_LEFT_UP, HIGH);
//   delay(percentage * HEADLIGHT_MOVEMENT_DELAY);
//   digitalWrite(OUT_PIN_LEFT_UP, LOW);

//   leftStatus = headlightValue + 10;
//   WinkduinoBLE::updateHeadlightChars();
// }

// void RightSleepCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
//   string value = pChar->getValue();
//   int headlightValue = String(value.c_str()).toInt();
//   double percentage = ((double)headlightValue) / 100;

//   // Client blocks this endpoint when headlights are already sleepy
//   if (rightStatus == 1) {
//     rightDown();
//     delay(HEADLIGHT_MOVEMENT_DELAY);
//     setAllOff();
//   }

//   digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
//   delay(percentage * HEADLIGHT_MOVEMENT_DELAY);
//   digitalWrite(OUT_PIN_RIGHT_UP, LOW);

//   rightStatus = headlightValue + 10;
//   WinkduinoBLE::updateHeadlightChars();
// }

void RequestCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();

  int valueInt = String(value.c_str()).toInt();

  // WinkduinoBLE::setBusy(true);

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
        if (leftStatus == 1) rightUp();
        else rightDown();

        delay(HEADLIGHT_MOVEMENT_DELAY);

        setAllOff();
        WinkduinoBLE::updateHeadlightChars();
      }

      leftWave();
      break;

    case 11:

      if (leftStatus != rightStatus) {
        if (rightStatus == 1) leftUp();
        else leftDown();

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
  // WinkduinoBLE::setBusy(false);
}

// NOTE: this is for waves.
void HeadlightCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string val = pChar->getValue();

  double multi = stod(val);
  Serial.printf("MULTI VAL: %f\n", multi);
  Storage::setHeadlightMulti(multi);
  headlightMultiplier = multi;
}

// 0 : onWrite expects value to be an index, 0-9
// 1 : index has been read
int customButtonPressUpdateState = 0;
int indexToUpdate = 0;

void CustomButtonPressCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();
  Serial.printf("Value: %s\n", value);
  // TODO: Store in storage
  if (value.compare("enable") == 0) {
    customButtonStatusEnabled = true;
    Storage::setCustomOEMButtonStatus(true);
    return;
  } else if (value.compare("disable") == 0) {
    customButtonStatusEnabled = false;
    Storage::setCustomOEMButtonStatus(false);
    return;
  }

  int parsedValue = stoi(value);
  // Updating maxTime
  if (value.length() > 1) {
    maxTimeBetween_ms = parsedValue;
    Storage::setDelay(maxTimeBetween_ms);
  } else {
    if (customButtonPressUpdateState == 0) {
      if (parsedValue > 9)
        return;
      indexToUpdate = parsedValue;
      customButtonPressUpdateState = 1;

    } else {
      customButtonPressUpdateState = 0;
      if (indexToUpdate == 0) return;

      customButtonPressArray[indexToUpdate] = parsedValue;

      Storage::setCustomButtonPressArray(indexToUpdate, parsedValue);

      if (parsedValue == 0) {
        int maxIndexNotZero = 0;
        for (int i = 0; i < 10; i++) {
          if (customButtonPressArray[i] == 0) {
            maxIndexNotZero = i;
            break;
          }
        }

        for (int i = maxIndexNotZero; i < 9; i++) {
          customButtonPressArray[i] = customButtonPressArray[i + 1];
          Storage::setCustomButtonPressArray(i, customButtonPressArray[i + 1]);
        }
      }
    }
  }
}

void updateProgress(size_t progress, size_t size) {
  double slope = 1.0 * (100 - 0) / (60 - 0);
  static int last_progress = -1;

  if (size > 0) {
    progress = (progress * 100) / size;
    progress = (progress > 100 ? 100 : progress);  // 0-100

    progress = 0 + slope * (progress - 0);

    if (progress != last_progress) {
      // UPDATE APP PROGRESS STATUS
      WinkduinoBLE::setFirmwarePercent(to_string(progress));
      last_progress = progress;
    }
  }
}

// TODO: FIGURE OUT THE WEIRD UPDATE STATUS TEXT. IT IS NOT COMING THROUGH CORRECTLY.

void setupUpdateServer() {
  server.onNotFound([]() {
    server.send(404, "text/plain", "Not Found");
  });

  server.on(
    String("/update"), HTTP_POST,
    [&]() {
      if (Update.hasError()) {
        server.send(200);
        WinkduinoBLE::setFirmwareUpdateStatus("failed");
      } else {

        server.client().setNoDelay(true);
        server.send(200);
        WinkduinoBLE::setFirmwareUpdateStatus("success");
        delay(100);
        server.client().stop();
        esp_ota_mark_app_valid_cancel_rollback();
        ESP.restart();
      }
    },
    [&]() {
      HTTPRaw& raw = server.raw();

      if (raw.status == RAW_START) {
        uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
        if (!Update.begin(maxSketchSpace, U_FLASH)) {  // start with max available size
          Update.printError(Serial);
        }
        WinkduinoBLE::setFirmwareUpdateStatus("updating");
      } else if (raw.status == RAW_ABORTED || Update.hasError()) {
        if (raw.status == RAW_ABORTED) {

          if (!Update.end(false)) {
            Update.printError(Serial);
            WinkduinoBLE::setFirmwareUpdateStatus("failed");
          }

          Serial.println("Update was aborted");
        }
      } else if (raw.status == RAW_WRITE) {
        if (Update.write(raw.buf, raw.currentSize) != raw.currentSize) {
          Update.printError(Serial);
        }
      } else if (raw.status == RAW_END) {
        if (Update.end(true)) {  // true to set the size to the current progress
          Serial.printf("Update Success: %u\nRebooting...\n", raw.totalSize);
        } else {
          Update.printError(Serial);
        }
      }
      delay(0);
    });

  Update.onProgress(updateProgress);
}

void OTAUpdateCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {

  string pass = pChar->getValue();
  const char* password = pass.c_str();

  const char* ssid = "Wink Module: Update Access Point";

  printf("SSID: %s  -  PASSWORD: %s\n", ssid, password);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);

  delay(150);

  setupUpdateServer();

  MDNS.begin("module-update");

  server.begin();

  MDNS.addService("http", "tcp", 80);

  wifi_enabled = true;
}

void handleHTTPClient() {
  server.handleClient();
}

void AdvertisingCallbacks::onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t inst_id) {
  switch (reason) {
    case 0:
      WinkduinoBLE::setDeviceConnected(true);
      printf("Client connecting\n");
      return;
    default:
      printf("Default case");
      break;
  }
}
