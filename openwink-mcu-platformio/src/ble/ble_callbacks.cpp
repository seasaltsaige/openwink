#include "ble/ble_callbacks.h"
#include "ble/ble.h"
#include "globals.h"
#include "handler/headlight_output.h"
#include "handler/queue.h"


#include "NimBLEDevice.h"
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
    string cmd = pCharacteristic->getValue();

    int cmd_int = stoi(cmd);

    // Forces command into HEADLIGHT_COMMAND range
    if (cmd_int <= 0 || cmd_int >= 12)
        return;

    // HEADLIGHT_COMMAND command = static_cast<HEADLIGHT_COMMAND>(cmd_int);
    printf("Sending command to queue: %d\n", cmd_int);
    xQueueSend(headlight_output_queue, &cmd_int, (TickType_t)10);
}

void LongTermSleepCharacteristicCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo)
{
    LEVEL sleep_input_level = (LEVEL)gpio_get_level(BUTTON_INPUT);
    esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

    if (sleep_input_level == LEVEL::HIGH)
        esp_sleep_enable_ext0_wakeup(BUTTON_INPUT, 0);
    else
        esp_sleep_enable_ext0_wakeup(BUTTON_INPUT, 1);

    esp_deep_sleep_start();
}


void AdvertisingCallbacks::onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t instId)
{
    if (reason == 0)
    {
        printf("Advertising stopped due to connection attempt...\n");
    }
    else if (reason == 13)
    {
        printf("Advertising stopped due to timeout...\n");
    }
    else
        printf("Advertising stopped for unknown reasons... Reason code: '%d'\n", reason);
}