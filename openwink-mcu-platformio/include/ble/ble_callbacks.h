#ifndef __BLE_CALLBACKS
#define __BLE_CALLBACKS

#include "NimBLECharacteristic.h"
#include "NimBLEServer.h"

class ServerCallbacks : NimBLEServerCallbacks
{
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override;

    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override;
};

class HeadlightMovementCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

#endif