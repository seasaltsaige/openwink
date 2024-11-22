#include <string.h>
#include <Arduino.h>

#include <Preferences.h>

#include <WiFi.h>
#include <Update.h>
#include <WebServer.h>
#include <ESPmDNS.h>

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

using namespace std;

class HeadlightCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {
    string val = pChar->getValue();

    double multi = stod(val) / 100.0;
    const char *headlightKey = "headlight-key";
    preferences.putDouble(headlightKey, multi);
    headlightMultiplier = multi;
  }
};

// 0 : onWrite expects value to be an index, 0-9
// 1 : index has been read
int customButtonPressUpdateState = 0;

int indexToUpdate = 0;

class CustomButtonPressCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {
    string value = pChar->getValue();

    // printf("VALUE: %s\n", value.c_str());

    // Updating maxTime
    if (value.length() > 1) {
      int newVal = stoi(value);
      maxTimeBetween_ms = newVal;
    } else {
      if (customButtonPressUpdateState == 0) {
        int index = stoi(value);
        if (index > 9)
          return;
        indexToUpdate = index;
        customButtonPressUpdateState = 1;
      } else {
        int updateValue = stoi(value);
        customButtonPressArray[indexToUpdate] = updateValue;
        customButtonPressUpdateState = 0;

        if (updateValue == 0) {
          int maxIndexNotZero = 0;
          for (int i = 0; i < 10; i++) {
            if (customButtonPressArray[i] == 0) {
              maxIndexNotZero = i;
              // printf("REACHED 0 VALUE: %d\n", i);
              break;
            }
          }

          for (int i = maxIndexNotZero; i < 9; i++) {
            // printf("Current: %d   -   Update: %d   -   Index: %d\n",  customButtonPressArray[i], customButtonPressArray[i + 1], i);
            customButtonPressArray[i] = customButtonPressArray[i + 1];
          }
        }
      }
    }
  }
};

class FirmwareCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onRead() {
    //
  }
};

const char *update_path = "update";

// Contains update progress value (0 to 100)%
NimBLECharacteristic *firmareUpdateNotifier = nullptr;
// POSSIBLE STATUS
// "idle" "updating" "failed" "success"
NimBLECharacteristic *firmwareStatus = nullptr;
WebServer httpServer(80);

double slope = 1.0 * (100 - 0) / (60 - 0);

void updateProgress(size_t progress, size_t size) {
  static int last_progress = -1;

  if (size > 0) {
    progress = (progress * 100) / size;
    progress = (progress > 100 ? 100 : progress);  // 0-100

    progress = 0 + slope * (progress - 0);

    if (progress != last_progress) {
      // UPDATE APP PROGRESS STATUS
      firmareUpdateNotifier->setValue(to_string(progress));
      firmareUpdateNotifier->notify();
      last_progress = progress;
    }
  }
}

bool wifi_started = false;
void setupHttpUpdateServer() {
  // Other code...
  // handler for the update page form POST
  httpServer.on(
    String("/") + String(update_path), HTTP_POST,
    [&]() {
      // handler when file upload finishes
      if (Update.hasError()) {
        printf("ERROR: %d\n", Update.getError());
        httpServer.send(200);
        firmwareStatus->setValue("failed");
        firmwareStatus->notify();
        printf("UPDATE FAILED\n");
      } else {
        httpServer.client().setNoDelay(true);
        printf("ERROR: %d\n", Update.getError());
        httpServer.send(200);
        firmwareStatus->setValue("success");
        firmwareStatus->notify();
        printf("UPDATE SUCCESS\n");
        delay(100);
        httpServer.client().stop();
        esp_ota_mark_app_valid_cancel_rollback();
        ESP.restart();
      }
    },
    [&]() {
      HTTPRaw &raw = httpServer.raw();

      if (raw.status == RAW_START) {
        uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
        if (!Update.begin(maxSketchSpace, U_FLASH)) {  // start with max available size
          Update.printError(Serial);
        } else {
          firmwareStatus->setValue("updating");
          firmwareStatus->notify();
        }
      } else if (raw.status == RAW_ABORTED || Update.hasError()) {
        if (raw.status == RAW_ABORTED) {
          if (!Update.end(false)) {
            Update.printError(Serial);
            firmwareStatus->setValue("failed");
            firmwareStatus->notify();
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

class OTAUpdateCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {
    string pass = pChar->getValue();
    const char *password = pass.c_str();

    const char *ssid = "Wink Module: Update Access Point";

    printf("SSID: %s  -  PASSWORD: %s\n", ssid, password);

    WiFi.mode(WIFI_AP);
    WiFi.softAP(ssid, password);

    delay(150);

    MDNS.begin("module-update");

    setupHttpUpdateServer();
    httpServer.begin();

    MDNS.addService("http", "tcp", 80);

    printf("HTTP Server started\n");

    wifi_started = true;
  }
};

class advertisingCallbacks : public NimBLEExtAdvertisingCallbacks {
  void onStopped(NimBLEExtAdvertising *pAdv, int reason, uint8_t inst_id) {
    switch (reason) {
      case 0:
        deviceConnected = true;
        printf("Client connecting\n");
        return;
      default:
        printf("Default case");
        break;
    }
  }
};

unsigned long t;

int advertiseTime_ms = 1000;
int sleepTime_us = 15 * 1000 * 1000;

NimBLEExtAdvertising *pAdvertising;
int pressCounter = 0;
unsigned long buttonTimer;

void setup() {

  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();

  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0)
    awakeTime_ms = 5 * 1000 * 60;
  else
    awakeTime_ms = 0;

  Serial.begin(115200);
  Storage::begin("oem-store");




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

  WinkduinoBLE

  esp_sleep_enable_timer_wakeup(sleepTime_us);

  t = millis();
  int wakeupValue = initialButton;
  initialButton = digitalRead(UP_BUTTON_INPUT);

  if (wakeupValue != -1 && (wakeupValue != initialButton)) {
    pressCounter++;
    buttonTimer = millis();
  }

  printf("Version %s\n", FIRMWARE_VERSION);

  if (pAdvertising->setInstanceData(0, extAdv)) {
    if (pAdvertising->start(0))
      printf("Started advertising\n");
    else
      printf("Failed to start advertising\n");
  } else
    printf("Failed to register advertisment data\n");
}

bool advertising = true;

void loop() {
  if (wifi_started) {
    httpServer.handleClient();
  }
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

  busyChar->setValue("1");
  busyChar->notify();

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
  updateHeadlightChars();
  busyChar->setValue("0");
  busyChar->notify();
}
