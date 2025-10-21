#include "ble/ble_callbacks.h"
#include "NimBLEDevice.h"
#include "ble/ble.h"
#include "esp_log.h"
#include "esp_sleep.h"

#include <string>

using namespace std;

// ===== BEGIN SERVER CALLBACK DEFS ===== //
const uint16_t MIN_INTERVAL = 48;
const uint16_t MAX_INTERVAL = 48;
const uint16_t LATENCY = 0;
const uint16_t TIMEOUT = 200;

void ServerCallbacks::onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo)
{
    BLE::setDeviceConnected(true);

    bool phy_update_success = pServer->updatePhy(connInfo.getConnHandle(), BLE_GAP_LE_PHY_CODED, BLE_GAP_LE_PHY_CODED, BLE_GAP_LE_PHY_CODED_MASK);
    if (!phy_update_success)
    {
        pServer->updatePhy(connInfo.getConnHandle(), BLE_GAP_LE_PHY_1M, BLE_GAP_LE_PHY_1M, BLE_GAP_LE_PHY_1M_MASK);
    }

    pServer->updateConnParams(connInfo.getConnHandle(), MIN_INTERVAL, MAX_INTERVAL, LATENCY, TIMEOUT);
    pServer->setDataLen(connInfo.getConnHandle(), 251);

    ESP_LOGI("BLE", "Successfully connected to BLE Client.\n");
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason)
{
    ESP_LOGI("BLE", "Disconnected from client, going to sleep...\n");
    BLE::setDeviceConnected(false);
    esp_deep_sleep_start();
}

// ===== END SERVER CALLBACK DEFS ===== //


void HeadlightMovementCharacteristicCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo)
{
    string attr = pCharacteristic->getValue();

    printf("Attr: %s\n", attr.c_str());
}


void AdvertisingCallbacks::onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t instId)
{

}