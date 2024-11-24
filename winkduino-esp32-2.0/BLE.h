#pragma once

#include <string.h>
#include <NimBLEDevice.h>
#include "constants.h"

using namespace std;

RTC_DATA_ATTR extern int leftStatus;
RTC_DATA_ATTR extern int rightStatus;

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
};
