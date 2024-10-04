#include <string.h>

#include <NimBLEDevice.h>
#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>

#include <NetworkClient.h>
#include <LittleFS.h>
// #include <LittleFS.h>
#include <Update.h>
#include <WebServer.h>
#include <ESPmDNS.h>

#include "driver/rtc_io.h"
#include "driver/gpio.h"
#include "esp_ota_ops.h"
#include "esp_mac.h"
#include "esp_sleep.h"

using namespace std;

#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif


#define OUT_PIN_LEFT_DOWN 4
#define OUT_PIN_LEFT_UP 5

#define OUT_PIN_RIGHT_DOWN 6
#define OUT_PIN_RIGHT_UP 7

// Using Right Headlight Up Wire
// Meaning up should be 1, down should be 0
#define UP_BUTTON_INPUT 15

#define FIRMWARE_VERSION "0.0.3"

Preferences preferences;

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;
RTC_DATA_ATTR int initialButton = -1;

bool buttonInterrupt();
void setAllOff();
void bothUp();
void leftUp();
void rightUp();
void bothDown();
void leftDown();
void rightDown();
void bothBlink();
void leftWink();
void rightWink();
void leftWave();
void rightWave();

#define SERVICE_UUID "a144c6b0-5e1a-4460-bb92-3674b2f51520"
#define REQUEST_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51520"
#define BUSY_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51521"

NimBLECharacteristic *busyChar = nullptr;

#define LEFT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51523"
#define RIGHT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51524"

#define LEFT_SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51525"
#define RIGHT_SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51527"
#define SYNC_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51526"

#define LONG_TERM_SLEEP_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51528"

#define OTA_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51529"

#define CUSTOM_BUTTON_UPDATE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51530"

#define FIRMWARE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51531"

#define SOFTWARE_UPDATING_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51532"
#define SOFTWARE_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51533"

#define HEADLIGHT_MOVEMENT_DELAY 750

NimBLECharacteristic *leftChar = nullptr;
NimBLECharacteristic *rightChar = nullptr;

static uint8_t primaryPhy = BLE_HCI_LE_PHY_CODED;
static uint8_t secondaryPhy = BLE_HCI_LE_PHY_CODED;

void updateHeadlightChars() {
  leftChar->setValue(std::string(String(leftStatus).c_str()));
  rightChar->setValue(std::string(String(rightStatus).c_str()));
  leftChar->notify();
  rightChar->notify();
}

bool deviceConnected = false;
int awakeTime_ms = 0;

const int customButtonPressArrayDefaults[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
const int maxTimeBetween_msDefault = 500;
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
RTC_DATA_ATTR int customButtonPressArray[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
RTC_DATA_ATTR int maxTimeBetween_ms = 500;

/* Handler class for server events */
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer *pServer, NimBLEConnInfo &connInfo) {
    deviceConnected = true;
    updateHeadlightChars();
    printf("Client connected:: %s\n", connInfo.getAddress().toString().c_str());
  };
  void onDisconnect(NimBLEServer *pServer) {

    for (int i = 0; i < 10; i++) {
      string key = "presses-";
      key = key + to_string(i);
      int val = preferences.getUInt(key.c_str(), customButtonPressArrayDefaults[i]);

      if (val != customButtonPressArray[i])
        preferences.putUInt(key.c_str(), customButtonPressArray[i]);
    }

    string delayKey = "delay-key";
    int del = preferences.getUInt(delayKey.c_str(), maxTimeBetween_msDefault);
    if (maxTimeBetween_ms != del)
      preferences.putUInt(delayKey.c_str(), maxTimeBetween_ms);

    deviceConnected = false;
    awakeTime_ms = 0;
    printf("Disconnected from client\n");
    NimBLEExtAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
    if (pAdvertising->start(0))
      printf("Started advertising\n");
    else
      printf("Failed to start advertising\n");
  };
};

class LongTermSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {
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
};

class SyncCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {

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
    updateHeadlightChars();

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
    updateHeadlightChars();
  }
};

class LeftSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {
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
    updateHeadlightChars();
  }
};

class RightSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pChar) {
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
    updateHeadlightChars();
  }
};

class RequestCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic *pCharacteristic) {
    int tempLeft = leftStatus;
    int tempRight = rightStatus;
    std::string value = pCharacteristic->getValue();
    int valueInt = String(value.c_str()).toInt();
    busyChar->setValue("1");
    busyChar->notify();
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
        if (tempRight == 0 || tempLeft == 0) {
          bothUp();
          delay(HEADLIGHT_MOVEMENT_DELAY);
          setAllOff();
          updateHeadlightChars();
        }
        leftWave();
        if (tempRight == 0 || tempLeft == 0) {
          delay(HEADLIGHT_MOVEMENT_DELAY);
          setAllOff();
          updateHeadlightChars();
          bothDown();
        }

        break;

      case 11:
        if (tempRight == 0 || tempLeft == 0) {
          bothUp();
          delay(HEADLIGHT_MOVEMENT_DELAY);
          setAllOff();
          updateHeadlightChars();
        }
        rightWave();
        if (tempRight == 0 || tempLeft == 0) {
          delay(HEADLIGHT_MOVEMENT_DELAY);
          setAllOff();
          updateHeadlightChars();
          bothDown();
        }
        break;
    }
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();
    updateHeadlightChars();
    busyChar->setValue("0");
    busyChar->notify();
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

void updateProgress(size_t progress, size_t size) {
  static int last_progress = -1;
  if (size > 0) {
    progress = (progress * 100) / size;
    progress = (progress > 100 ? 100 : progress);  //0-100
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
        httpServer.send(200, F("text/html"), String(F("<META http-equiv=\"refresh\" content=\"5;URL=/\">Update error: ")) + String(Update.errorString()));
        firmwareStatus->setValue("failed");
        firmwareStatus->notify();
      } else {
        httpServer.client().setNoDelay(true);
        httpServer.send(200, PSTR("text/html"), String(F("<META http-equiv=\"refresh\" content=\"15;URL=/\">Update Success! Rebooting...")));
        firmwareStatus->setValue("success");
        firmwareStatus->notify();

        if (Update.isFinished()) {
          esp_ota_mark_app_valid_cancel_rollback();
        } else {
          esp_ota_mark_app_invalid_rollback_and_reboot();
        }

        delay(100);
        httpServer.client().stop();
        ESP.restart();
      }
    },
    [&]() {
      // handler for the file upload, gets the sketch bytes, and writes
      // them through the Update object
      HTTPRaw &raw = httpServer.raw();
      if (raw.status == RAW_START) {
        if (!Update.begin(LittleFS.totalBytes(), U_SPIFFS)) {  //start with max available size
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
        Serial.printf(".");
        if (Update.write(raw.buf, raw.currentSize) != raw.currentSize) {
          Update.printError(Serial);
        }
      } else if (raw.status == RAW_END) {
        if (Update.end(true)) {  //true to set the size to the current progress
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


    // Update.setupCrypt(0, 0, 0xf, U_AES_DECRYPT_AUTO);

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

int advertiseTime_ms = 800;
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
  preferences.begin("oem-store", false);

  char key[15];  // Allocate enough space for the key strings

  for (int i = 0; i < 10; i++) {
    snprintf(key, sizeof(key), "presses-%d", i);  // Use snprintf to format the key
    int val = preferences.getUInt(key, customButtonPressArrayDefaults[i]);
    customButtonPressArray[i] = val;
  }

  const char *delayKey = "delay-key";
  int del = preferences.getUInt(delayKey, maxTimeBetween_msDefault);
  maxTimeBetween_ms = del;

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

  NimBLEDevice::init("Winkduino");

  // NimBLEDevice::setM

  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks);

  NimBLEService *pService = pServer->createService(NimBLEUUID(SERVICE_UUID));

  NimBLECharacteristic *winkChar = pService->createCharacteristic(REQUEST_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *leftSleepChar = pService->createCharacteristic(LEFT_SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *rightSleepChar = pService->createCharacteristic(RIGHT_SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *syncChar = pService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *longTermSleepChar = pService->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *otaUpdateChar = pService->createCharacteristic(OTA_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *customButtonChar = pService->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE);

  NimBLECharacteristic *firmwareChar = pService->createCharacteristic(FIRMWARE_UUID, NIMBLE_PROPERTY::READ);

  firmwareChar->setValue(FIRMWARE_VERSION);

  syncChar->setValue(0);
  winkChar->setValue(0);

  busyChar = pService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  leftChar = pService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  rightChar = pService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  firmareUpdateNotifier = pService->createCharacteristic(SOFTWARE_UPDATING_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);

  firmwareStatus = pService->createCharacteristic(SOFTWARE_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  firmwareStatus->setValue("idle");

  updateHeadlightChars();

  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  leftSleepChar->setCallbacks(new LeftSleepCharacteristicCallbacks());
  rightSleepChar->setCallbacks(new RightSleepCharacteristicCallbacks());
  longTermSleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());
  otaUpdateChar->setCallbacks(new OTAUpdateCharacteristicCallbacks());
  customButtonChar->setCallbacks(new CustomButtonPressCharacteristicCallbacks());

  firmwareChar->setCallbacks(new FirmwareCharacteristicCallbacks());

  pService->start();

  if (!LittleFS.begin(true)) {
    printf("Little FS FAILED\n");
  }

  NimBLEExtAdvertisement extAdv(primaryPhy, secondaryPhy);

  extAdv.setConnectable(true);
  extAdv.setScannable(false);

  extAdv.setCompleteServices({ NimBLEUUID(SERVICE_UUID) });

  pAdvertising = NimBLEDevice::getAdvertising();

  pAdvertising->setCallbacks(new advertisingCallbacks);

  esp_sleep_enable_timer_wakeup(sleepTime_us);

  t = millis();
  int wakeupValue = initialButton;
  initialButton = digitalRead(UP_BUTTON_INPUT);

  if (wakeupValue != -1 && (wakeupValue != initialButton)) {
    pressCounter++;
    buttonTimer = millis();
  }




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

// Both
void bothUp() {
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  }

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  }

  leftStatus = 1;
  rightStatus = 1;
}

void bothDown() {
  if (leftStatus != 0) {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
  }

  if (rightStatus != 0) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  }

  leftStatus = 0;
  rightStatus = 0;
}

void bothBlink() {
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }

  updateHeadlightChars();
  delay(HEADLIGHT_MOVEMENT_DELAY);

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  updateHeadlightChars();
}

// Left
void leftUp() {
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
}

void leftDown() {
  if (leftStatus != 0) {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
}

void leftWink() {

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  updateHeadlightChars();
  delay(HEADLIGHT_MOVEMENT_DELAY);

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
  updateHeadlightChars();
}

// Right
void rightUp() {
  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
}

void rightDown() {
  if (rightStatus != 0) {
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    rightStatus = 0;
  }
}

void rightWink() {

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  updateHeadlightChars();

  delay(HEADLIGHT_MOVEMENT_DELAY);

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  updateHeadlightChars();
}

void leftWave() {
  // Left Down
  digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  leftStatus = 0;
  updateHeadlightChars();

  // Right down
  digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  // Turn Left Down off
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

  // wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  rightStatus = 0;
  updateHeadlightChars();

  // Left Up
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  // Turn Right Down off
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  leftStatus = 1;
  updateHeadlightChars();

  // Right back up
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  // Left Up Off
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  rightStatus = 1;
}

void rightWave() {
  // Right Down
  digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  rightStatus = 0;
  updateHeadlightChars();

  // Left Down
  digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  // Turn Right Down off
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  leftStatus = 0;
  updateHeadlightChars();

  // Right Up
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  // Turn Left Down off
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  rightStatus = 1;
  updateHeadlightChars();

  // Left Up
  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  // Turn Right Up off
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  leftStatus = 1;
}

void setAllOff() {
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
}
