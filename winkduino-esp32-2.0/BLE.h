#pragma once

#include <string.h>
#include <NimBLEDevice.h>
#include "constants.h"

using namespace std;

RTC_DATA_ATTR extern int leftStatus;
RTC_DATA_ATTR extern int rightStatus;

class WinkduinoBLE {
private:

  static NimBLEServer* server;

  static NimBLEExtAdvertisement advertisement;
  static NimBLEExtAdvertising*  advertising;

  static NimBLEService* winkService;
  // WINK CHARACTERISTICS
  static NimBLECharacteristic* winkChar;
  static NimBLECharacteristic* busyChar;
  static NimBLECharacteristic* leftStatusChar;
  static NimBLECharacteristic* rightStatusChar;
  static NimBLECharacteristic* leftSleepChar;
  static NimBLECharacteristic* rightSleepChar;
  static NimBLECharacteristic* syncChar;


  static NimBLEService* otaService;
  // OTA CHARACTERISTICS
  static NimBLECharacteristic* otaUpdateChar;
  static NimBLECharacteristic* firmareUpdateNotifier;
  static NimBLECharacteristic* firmwareStatus;
  static NimBLECharacteristic* firmwareChar;


  static NimBLEService* settingsService;
  // SETTINGS CHARACTERISTICS
  static NimBLECharacteristic* longTermSleepChar; 
  static NimBLECharacteristic* customButtonChar;
  static NimBLECharacteristic* headlightDelayChar;

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

  static bool getDeviceConnected() {
    return deviceConnected;
  }

  static void setDeviceConnected(bool deviceStatus) {
    deviceConnected = deviceStatus;
  }
};
