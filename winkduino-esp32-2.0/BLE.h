#ifndef _BLE_H
#define _BLE_H

#include <string.h>
#include <NimBLEDevice.h>

const uint8_t primaryPhy = BLE_HCI_LE_PHY_CODED;
const uint8_t secondaryPhy = BLE_HCI_LE_PHY_CODED;

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;
RTC_DATA_ATTR int initialButton = -1;

class WinkduinoBLE
{
  private:
    NimBLEServer* server;
    NimBLEService* service;
    NimBLEExtAdvertisement adv(primaryPhy, secondaryPhy);


    void initDeviceServer();
    void initServerService();
    void initServerCharacteristics();
    void initAdvertising();
  public:
    WinkduinoBLE(string deviceName);
    void initDevice();
    void start();
};

#endif