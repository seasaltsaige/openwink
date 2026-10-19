#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>


#include <NimBLEDevice.h>
#include <algorithm>

#include "ble/ble_callbacks.hpp"
#include "ble/ble_handler.h"
#include "ble/pairing_auth.h"
#include "button_bindings.h"
#include "command_output.h"
#include "custom_command_output.h"


void ServerCallbacks::onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) {
    pServer->updatePhy(connInfo.getConnHandle(), BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_S8);
    pServer->setDataLen(connInfo.getConnHandle(), MAX_LL_DATA);

    set_device_status(CONNECTED);

    set_auth_state(AUTH_ESTABLISHED);
    // begin_auth_on_connection();
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

    if (d.size() < 1)
        return;

    // copy data up to max size
    custom_command_data_t command{};
    size_t copy_size = std::min<size_t>(CUSTOM_CMD_HEADER_LENGTH + PAYLOAD_MAX, d.size());
    memcpy(&command, data, copy_size);

    uint8_t validate_res = validate_custom_command(&command, d.size());
    if (validate_res == 0)
        request_command_submission(&command);
}

void CustomButtonCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    // must be at least 2 bytes long to delete a binding
    if (d.size() < 2)
        return;

    // first byte represents binding pos
    // there can only be 8 bindings
    if (data[0] > 7)
        return;

    button_binding_t binding{};

    // if we have a deletion packet, we dont really need to check much else
    // just send it
    if (data[1] == DELETE_BINDING_FLAG) {
        delete_binding_at_pos(data[0]);
        return;
    }

    size_t copy_size = std::min<size_t>(sizeof(button_binding_t), (d.size() - BINDING_POS_LEN));
    // copy from offset of pos
    memcpy(&binding, (data + BINDING_POS_LEN), copy_size);

    uint8_t validate_result = validate_button_binding(&binding, (d.size() - BINDING_POS_LEN));
    if (validate_result == 0)
        set_binding_at_pos(&binding, data[0]);
}


void SleepySettingsCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
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