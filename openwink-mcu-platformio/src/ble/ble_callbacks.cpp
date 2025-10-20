#include "ble/ble_callbacks.h"
#include "ble/ble.h"

void ServerCallbacks ::onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo)
{
    BLE::setDeviceConnected(true);
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason)
{

    BLE::setDeviceConnected(false);
}