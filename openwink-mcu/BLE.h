#include "NimBLECharacteristic.h"
#pragma once

#include <string.h>
#include <NimBLEDevice.h>
#include "constants.h"

using namespace std;

extern int leftStatus;
extern int rightStatus;

class BLE {
private:

  static NimBLEServer* server;

  static NimBLEExtAdvertisement advertisement;
  static NimBLEExtAdvertising* advertising;

  static NimBLEService* winkService;
  // WINK CHARACTERISTICS
  static NimBLECharacteristic* winkChar;
  static NimBLECharacteristic* busyChar;
  static NimBLECharacteristic* leftStatusChar;
  static NimBLECharacteristic* rightStatusChar;
  static NimBLECharacteristic* sleepChar;
  static NimBLECharacteristic* customCommandChar;
  static NimBLECharacteristic* syncChar;


  static NimBLEService* otaService;
  // OTA CHARACTERISTICS
  static NimBLECharacteristic* otaUpdateChar;
  static NimBLECharacteristic* firmwareUpdateNotifier;
  static NimBLECharacteristic* firmwareStatus;
  static NimBLECharacteristic* firmwareChar;


  static NimBLEService* settingsService;
  // SETTINGS CHARACTERISTICS
  static NimBLECharacteristic* longTermSleepChar;
  static NimBLECharacteristic* customButtonChar;
  static NimBLECharacteristic* headlightDelayChar;
  static NimBLECharacteristic* headlightMotionChar;
  static NimBLECharacteristic* sleepSettingsChar;
  static NimBLECharacteristic* unpairChar;
  static NimBLECharacteristic* resetChar;
  static NimBLECharacteristic* headlightBypassChar;
  static NimBLECharacteristic* headlightOrientationChar;

  static NimBLECharacteristic* passkeyChar;

  static bool deviceConnected;

  static void initDeviceServer();
  static void initServerService();
  static void initAdvertising();
  static void initServiceCharacteristics();

public:
  static void init(string deviceName);
  static void start();
  static void updateHeadlightChars();
  static void setBusy(bool busy);
  static void setFirmwareUpdateStatus(string status);
  static void setFirmwarePercent(string stringPercentage);
  static void setMotionInValue(int value);
  static void setSwapStatus(bool swap) {
    if (swap)
      headlightOrientationChar->setValue("1");
    else 
      headlightOrientationChar->setValue("0");
    headlightOrientationChar->notify();
  }
  static void setCustomStatus(int value) {
    if (value == 0)
      customCommandChar->setValue("0");
    else
      customCommandChar->setValue("1");
    customCommandChar->notify();
  }

  static bool getDeviceConnected() {
    return deviceConnected;
  }

  static void setDeviceConnected(bool deviceStatus) {
    deviceConnected = deviceStatus;
  }

  static void disconnect(const NimBLEConnInfo &connInfo) {
    server->disconnect(connInfo);
  }
};
