#include "esp32-hal-gpio.h"
#include "esp32-hal.h"
#include <string.h>
#include <vector>
#include "NimBLEDevice.h"
#include <Arduino.h>
#include <string.h>
#include "constants.h"
#include "BLECallbacks.h"
#include "BLE.h"
#include "MainFunctions.h"
#include "ButtonHandler.h"
#include "esp_sleep.h"
#include "Storage.h"
#include <Update.h>
#include <iostream>
#include "esp_ota_ops.h"

using namespace std;

RTC_DATA_ATTR double headlightMultiplier = 1.0;

RTC_DATA_ATTR int customButtonPressArray[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
RTC_DATA_ATTR int maxTimeBetween_ms = 500;
RTC_DATA_ATTR bool customButtonStatusEnabled = false;
int queuedCommand = -1;
string queuedCustomCommand = "";

WebServer server(80);
bool wifi_enabled = false;

const uint16_t MIN_INTERVAL = 12;
const uint16_t MAX_INTERVAL = 24;
const uint16_t LATENCY = 0;
const uint16_t TIMEOUT = 200;


bool connEstablishing = false;

void ServerCallbacks::onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) {

  BLE::setDeviceConnected(true);
  BLE::updateHeadlightChars();
  bool update = pServer->updatePhy(connInfo.getConnHandle(), BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_S8);
  if (update) {
    Serial.println("PHY SUCCESSFULLY UPDATE");
  } else {
    Serial.println("PHY UPDATE FAILED");
  }
  
  pServer->updateConnParams(connInfo.getConnHandle(), MIN_INTERVAL, MAX_INTERVAL, LATENCY, TIMEOUT);
  pServer->setDataLen(connInfo.getConnHandle(), 251);
  connEstablishing = false;
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) {
  BLE::setDeviceConnected(false);
  awakeTime_ms = 0;
  BLE::init("OpenWink");
  BLE::start();
}

void ServerCallbacks::onPhyUpdate(NimBLEConnInfo& connInfo, uint8_t txPhy, uint8_t rxPhy) {
  Serial.printf("Phy Update Request Completed: %d, %d\n", txPhy, rxPhy);
}


void ServerCallbacks::onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) {
  Serial.printf("MTU Update Completed, set to %d\n", MTU);
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

void SyncCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  // if headlights are fully up or down, ignore command
  if ((leftStatus == 1 || leftStatus == 0) && (rightStatus == 1 || rightStatus == 0)) return;

  double percentageToUpLeft = 1 - (leftSleepyValue / 100);
  double percentageToUpRight = 1 - (rightSleepyValue / 100);
  unsigned long initialTime = millis();

  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

  bool leftStatusReached = false;
  bool rightStatusReached = false;

  while (!leftStatusReached || !rightStatusReached) {
    unsigned long timeElapsed = (millis() - initialTime);
    if (!leftStatusReached && timeElapsed >= (percentageToUpLeft * HEADLIGHT_MOVEMENT_DELAY)) {
      leftStatusReached = true;
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
    }
    if (!rightStatusReached && timeElapsed >= (percentageToUpRight * HEADLIGHT_MOVEMENT_DELAY)) {
      rightStatusReached = true;
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    }
  }

  setAllOff();

  leftStatus = 1;
  rightStatus = 1;

  BLE::updateHeadlightChars();
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
    setAllOff();
  }

  unsigned long initialTime = millis();

  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

  bool leftStatusReached = false;
  bool rightStatusReached = false;

  // Delay loop for both headlights
  while (!leftStatusReached || !rightStatusReached) {
    unsigned long timeElapsed = (millis() - initialTime);
    if (!leftStatusReached && timeElapsed >= (left * HEADLIGHT_MOVEMENT_DELAY)) {
      leftStatusReached = true;
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
    }
    if (!rightStatusReached && timeElapsed >= (right * HEADLIGHT_MOVEMENT_DELAY)) {
      rightStatusReached = true;
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    }
  }

  setAllOff();

  leftStatus = leftSleepyValue + 10;
  rightStatus = rightSleepyValue + 10;

  BLE::updateHeadlightChars();
}

// Updates headlight status
void SleepSettingsCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();
  char* charCVal = const_cast<char*>(value.c_str());

  char* left = strtok(charCVal, "-");
  char* right = strtok(NULL, "-");

  leftSleepyValue = stod(string(left));
  rightSleepyValue = stod(string(right));

  Storage::setSleepyValues(0, leftSleepyValue);
  Storage::setSleepyValues(1, rightSleepyValue);
}

void RequestCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();

  int valueInt = String(value.c_str()).toInt();
  queuedCommand = valueInt;
}

// NOTE: this is for waves.
void HeadlightCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string val = pChar->getValue();

  double multi = stod(val);
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


void CustomCommandCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();

  // Set command active/not
  if (value.length() == 1) {
    if (stoi(value) == 1)
      ButtonHandler::setCustomCommandActive(true);
    else if (stoi(value) == 0)
      ButtonHandler::setCustomCommandActive(false);
    else ButtonHandler::setCustomCommandActive(false);
  } else
    queuedCustomCommand = value;
}

void UnpairCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  Storage::clearWhitelist();
  // NimBLEDevice::deleteAllBonds();
  BLE::disconnect(info);
};

void ResetCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  // Resets all stored data on esp.
  // all customizations, etc
  // does not affect bond
  Storage::reset();
  bothBlink();
  delay(HEADLIGHT_MOVEMENT_DELAY);
  setAllOff();
  bothBlink();
  delay(HEADLIGHT_MOVEMENT_DELAY);
  setAllOff();
};

// TODO: Timer based check, auto disconnect if characteristic not set/bonded
void ClientMacCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {
  string value = pChar->getValue();
  string storedMac = Storage::getWhitelist();

  if (storedMac.length() == 0) {
    // Set bond, let client know bond happened
    Storage::setWhitelist(value);
    pChar->setValue("5");
    pChar->notify();
  } else {
    // check if mac checks out
    if (value == storedMac) {
      pChar->setValue("1");
      pChar->notify();
    } else {
      BLE::disconnect(info);
    }
  }
}

bool updateInProgress = false;
int buffTotalSize = 0;
int buffSizeWritten = 0;
int lastProgress = -1;

void OTAUpdateCharacteristicCallbacks::onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) {

  string charData = pChar->getValue();
  size_t len = pChar->getLength();

  if (charData == "START") {
    NimBLEServer* server = NimBLEDevice::getServer();

    bool phy2mSuccess = server->updatePhy(info.getConnHandle(), BLE_GAP_LE_PHY_2M_MASK, BLE_GAP_LE_PHY_2M_MASK, BLE_GAP_LE_PHY_CODED_ANY);
    if (phy2mSuccess) {
      Serial.println("Successfully updated PHY to 2M for OTA Update");
    } else {
      Serial.println("Failed to update PHY to 2M... Trying 1M");
      bool phy1mSuccess = server->updatePhy(info.getConnHandle(), BLE_GAP_LE_PHY_1M_MASK, BLE_GAP_LE_PHY_1M_MASK, BLE_GAP_LE_PHY_CODED_ANY);
      if (phy1mSuccess) {
        Serial.println("Successfully updated PHY to 1M for OTA Update");
      } else {
        Serial.println("Failed to update PHY to 1M.");
      }
    }

    updateInProgress = true;
    buffTotalSize = 0;
    buffSizeWritten = 0;
    BLE::setFirmwareUpdateStatus("updating");
    Serial.println("OTA Update Started");
    return;
  } else if (charData == "HALT") {
    updateInProgress = false;
    buffTotalSize = 0;
    buffSizeWritten = 0;
    BLE::setFirmwareUpdateStatus("canceled");
    Serial.println("OTA Update Canceled");
    return;
  }


  // const uint8_t* = (const uint8_t*)charData.data();

  if (updateInProgress) {
    // Update in progress, but no file size written yet, needs to be set
    if (buffTotalSize == 0) {

      int fileSize = stoi(charData);
      buffTotalSize = fileSize;

      Serial.printf("OTA File Size: %d\n", fileSize);

      uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
      if (!Update.begin(maxSketchSpace, U_FLASH)) {  // start with max available size
        Update.printError(Serial);
        updateInProgress = false;
        BLE::setFirmwareUpdateStatus("failed");
        Serial.println("OTA Update Failed to initialize");
        return;
      }
    } else {

      // handle finish ota update
      // restart and apply firmware if update successful
      if (charData == "DONE") {
        if (buffTotalSize != buffSizeWritten) {
          // Something went wrong, buff sizes do not match as expected
          Serial.printf("OTA Size mismatch Total: %d - Received: %d\n", buffTotalSize, buffSizeWritten);
          Update.end(false);
        } else if (Update.end(true)) {
          Serial.println("Update success");
          BLE::setFirmwareUpdateStatus("success");
          esp_ota_mark_app_valid_cancel_rollback();
          ESP.restart();
        } else {
          Serial.println("OTA Update failed to finalize");
          Update.printError(Serial);
        }
        updateInProgress = false;
        return;
      }

      uint8_t* toWriteData = const_cast<uint8_t*>((const uint8_t*)charData.data());
      if (buffTotalSize > buffSizeWritten) {
        size_t writtenSize = Update.write(toWriteData, len);
        // Serial.printf("Wrote size: %zu\nTotal Written out of Total Size: (%d/%d)", writtenSize, buffSizeWritten, buffTotalSize);
        if (writtenSize != len) {
          // Something went wrong writting data, update void
          updateInProgress = false;
          BLE::setFirmwareUpdateStatus("failed");
          Serial.println("OTA Update Failed");
          return;
        }

        buffSizeWritten += writtenSize;
        int progress = (buffSizeWritten * 100) / buffTotalSize;
        if (progress != lastProgress) {
          lastProgress = progress;
          Serial.printf("OTA Progress at %d\n", progress);
          BLE::setFirmwarePercent(to_string(progress));
        }
      }
    }
  }
}

void AdvertisingCallbacks::onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t inst_id) {
  switch (reason) {
    case 0:
      if (!connEstablishing) {
        BLE::setDeviceConnected(true);
        printf("Client connecting\n");
        connEstablishing = true;
      }
      return;
    default:
      printf("Default case");
      break;
  }
}
