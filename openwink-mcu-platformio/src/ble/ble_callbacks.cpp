#include <NimBLEDevice.h>
#include <freertos/queue.h>

#include "ble/ble_callbacks.hpp"
#include "ble/ble_handler.h"
#include "ble/pairing_auth.h"

#include "command_output.h"
#include "custom_command_output.h"


void ServerCallbacks::onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) {
    pServer->updatePhy(connInfo.getConnHandle(), BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_S8);
    pServer->setDataLen(connInfo.getConnHandle(), MAX_LL_DATA);

    set_device_status(CONNECTED);
    // TODO: Based on nvs state, wait for token/claim seq
    begin_auth_on_connection();
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) {
    // Handle disconnect
    set_device_status(DISCONNECTED);
    reset_auth_on_disconnect();
    begin_advertising();
}

void ServerCallbacks::onPhyUpdate(NimBLEConnInfo& connInfo, uint8_t txPhy, uint8_t rxPhy) {
    // Handle PHY update
}

void ServerCallbacks::onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) {
    // Handle MTU change
}


void AdvertisingCallbacks::onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t inst_id) {
    switch (reason) {
    case 0: printf("Client connecting\n"); break;
    default: printf("Default case"); break;
    }
}

// TODO: ADD GUARDS TO ALL CALLBACKS REQUIRING AUTH STATE
void HeadlightCommandCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    // out of range command
    if (data[0] < COMMAND_BOTH_UP || data[0] > COMMAND_SLEEPY_EYE)
        return;

    command_types_t cmd = (command_types_t)(data[0]);
    xQueueSend(command_output_queue, &cmd, 0);
}

void CustomCommandCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    custom_command_data_t* command = (custom_command_data_t*)data;
    // handle fail case in the future?
    request_command_submission(command);
}


void AuthCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    // writes should only do something if specifically waiting for it
    if (get_auth_state() != AUTH_WAIT_TOK && get_auth_state() != AUTH_WAIT_ECHO)
        return;

    NimBLEAttValue val = pCharacteristic->getValue();
    handle_passkey_write(val.data(), val.size());
}

// Only notify key once subscription is established
void AuthCallbacks::onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) {
    if ((subValue & 0x0001) != 0)
        client_subscribed_auth();
}