#ifndef __BLE_CALLBACKS
#define __BLE_CALLBACKS

#include "NimBLEDevice.h"

class ServerCallbacks : public NimBLEServerCallbacks
{
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override;
    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override;
};

class HeadlightMovementCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

class AdvertisingCallbacks : public NimBLEExtAdvertisingCallbacks
{
    void onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t instId);
};

class LongTermSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

#endif