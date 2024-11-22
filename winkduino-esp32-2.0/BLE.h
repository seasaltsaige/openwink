#ifndef _BLE_H
#define _BLE_H

#include <string.h>
#include <NimBLEDevice.h>
#include "constants.h"

const uint8_t primaryPhy = BLE_HCI_LE_PHY_CODED;
const uint8_t secondaryPhy = BLE_HCI_LE_PHY_CODED;

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;
RTC_DATA_ATTR int initialButton = -1;

class WinkduinoBLE
{
  private:
    static NimBLEServer* server;
    static NimBLEService* service;
    static NimBLEExtAdvertisement advertisement;
    static NimBLEExtAdvertising* advertising;
    static NimBLECharacteristic *winkChar;
    static NimBLECharacteristic *leftSleepChar;
    static NimBLECharacteristic *rightSleepChar;
    static NimBLECharacteristic *syncChar;
    static NimBLECharacteristic *longTermSleepChar; 
    static NimBLECharacteristic *otaUpdateChar;
    static NimBLECharacteristic *customButtonChar;
    static NimBLECharacteristic *headlightDelayChar;
    static NimBLECharacteristic *firmwareChar;
    static NimBLECharacteristic *busyChar;
    static NimBLECharacteristic *leftChar;
    static NimBLECharacteristic *rightChar;
    static NimBLECharacteristic *firmareUpdateNotifier;
    static NimBLECharacteristic *firmwareStatus;
    static void init(string deviceName);
    static void initDeviceServer();
    static void initServerService();
    static void initAdvertising();
    static void initServiceCharacteristics();
  public:
    WinkduinoBLE() = delete;
    static void init(string deviceName);
    static void initDevice();
    static void start();

    static void updateHeadlightChars();
    static void setBusy(bool busy);
};

#endif