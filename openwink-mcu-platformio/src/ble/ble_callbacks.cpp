#include <FreeRTOSConfig.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>


#include <NimBLEDevice.h>
#include <algorithm>

#include "aux_input.h"
#include "ble/ble_callbacks.hpp"
#include "ble/ble_handler.h"
#include "ble/debugger/ble_debugger.h"
#include "ble/pairing_auth.h"
#include "button_bindings.h"
#include "command_output.h"
#include "custom_command_output.h"
#include "module_settings.h"
#include "sleep_handler.h"

static const char* TAG = "BLE";


void ServerCallbacks::onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) {
    pServer->updatePhy(connInfo.getConnHandle(), BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_MASK, BLE_GAP_LE_PHY_CODED_S8);

    ble_gattc_exchange_mtu(connInfo.getConnHandle(), NULL, NULL);
    pServer->setDataLen(connInfo.getConnHandle(), MAX_LL_DATA);

    pServer->updateConnParams(connInfo.getConnHandle(), 48, 48, 0, 200);

    set_device_status(CONNECTED);

    begin_auth_on_connection();
}

void ServerCallbacks::onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) {
    // Handle disconnect
    set_device_status(DISCONNECTED);
    reset_sleep_on_disconnect();
    reset_auth_on_disconnect();
    reset_debugger_on_disconnect();
    begin_advertising();
}

void ServerCallbacks::onPhyUpdate(NimBLEConnInfo& connInfo, uint8_t txPhy, uint8_t rxPhy) {
    BLE_LOGV(TAG, "PHY update: tx=%u rx=%u", txPhy, rxPhy);
}

void ServerCallbacks::onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) {
    BLE_LOGV(TAG, "MTU updated: %u", MTU);
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
    if (d.size() < 1) {
        BLE_LOGE(TAG, "Empty headlight cmd write");
        return;
    }

    const uint8_t* data = d.data();

    // out of range command
    if (data[0] < COMMAND_BOTH_UP || data[0] > COMMAND_SLEEPY_EYE) {
        BLE_LOGE(TAG, "Invalid headlight cmd: 0x%02X", data[0]);
        return;
    }

    command_types_t cmd = (command_types_t)(data[0]);
    BLE_LOGI(TAG, "Command write: %s", command_to_str(cmd));
    xQueueSend(command_output_queue, &cmd, 0);
}

void HeadlightStatusCallbacks::onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) {
    if ((subValue & 0x0001) != 0)
        ble_notify_headlight_status();
}

void CustomCommandCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    if (d.size() < 1) {
        BLE_LOGE(TAG, "Empty custom cmd write");
        return;
    }

    if (d.size() == 1 && data[0] == CANCEL_COMMAND_PAYLOAD) {
        BLE_LOGD(TAG, "Custom cmd cancellation requested");
        request_command_cancellation();
        return;
    }

    BLE_LOGV(TAG, "Custom cmd write (%u bytes)", (unsigned int)d.size());

    // copy data up to max size
    custom_command_data_t command{};
    size_t copy_size = std::min<size_t>(CUSTOM_CMD_HEADER_LENGTH + PAYLOAD_MAX, d.size());
    memcpy(&command, data, copy_size);

    uint8_t validate_res = validate_custom_command(&command, d.size());
    if (validate_res) {
        if (request_command_submission(&command) == pdPASS)
            BLE_LOGI(TAG, "Custom cmd accepted (len=%u, loop=%u)", command.sequence_length, command.looping);
        else
            BLE_LOGW(TAG, "Custom cmd busy (already running)");
    } else {
        BLE_LOGE(TAG, "Custom cmd invalid (%u bytes)", (unsigned int)d.size());
    }
}

void CustomButtonCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    // must be at least 2 bytes long ([pos][delete] or [pos][binding])
    if (d.size() < 2) {
        BLE_LOGW(TAG, "Invalid binding packet (size=%u)", (unsigned int)d.size());
        return;
    }

    // first byte represents binding pos (0..7)
    if (data[0] >= NUM_BINDINGS) {
        BLE_LOGE(TAG, "Invalid binding pos: %u", data[0]);
        return;
    }

    // deletion packet: [pos][BINDING_DELETE_FLAG]
    if (d.size() == 2 && data[1] == BINDING_DELETE_FLAG) {
        BLE_LOGI(TAG, "Delete binding at pos %u", data[0]);
        delete_binding_at_pos(data[0]);
        return;
    }

    button_binding_t binding{};

    size_t copy_size = std::min<size_t>(sizeof(button_binding_t), (d.size() - BINDING_POS_LEN));
    // copy from offset of pos
    memcpy(&binding, (data + BINDING_POS_LEN), copy_size);

    uint8_t validate_result = validate_button_binding(&binding, (d.size() - BINDING_POS_LEN));
    if (validate_result) {
        BLE_LOGI(TAG, "Set binding at pos %u (%s)", data[0], binding_type_to_str(binding.type));
        set_binding_at_pos(&binding, data[0]);
    } else {
        BLE_LOGE(TAG, "Binding validation failed at pos %u", data[0]);
    }
}

void AuxSettingsCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    // must be at least 2 bytes long ([side][delete] or [side][aux_button_t])
    if (d.size() < 2) {
        BLE_LOGE(TAG, "Invalid aux packet (size=%u)", (unsigned int)d.size());
        return;
    }

    if (data[0] > TWO) {
        BLE_LOGE(TAG, "Invalid aux side: %u", data[0]);
        return;
    }

    aux_side_t side = (aux_side_t)data[0];

    if (d.size() == 2 && data[1] == BINDING_DELETE_FLAG) {
        BLE_LOGI(TAG, "Delete aux binding for %s", aux_side_to_str(side));
        delete_aux(side);
        return;
    }

    aux_button_t aux{};
    size_t copy_size = std::min<size_t>(sizeof(aux_button_t), (d.size() - AUX_SIDE_LEN));
    memcpy(&aux, (data + AUX_SIDE_LEN), copy_size);

    uint8_t validate_result = validate_aux(&aux, (d.size() - AUX_SIDE_LEN));
    if (validate_result) {
        BLE_LOGI(TAG, "Set aux %s (%s, %s)", aux_side_to_str(side), aux_type_to_str(aux.button_type), binding_type_to_str(aux.action.type));
        update_aux(side, &aux);
    } else {
        BLE_LOGE(TAG, "Aux validation failed for %s", aux_side_to_str(side));
    }
}

void GeneralSettingsCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    handle_general_setting(d.data(), d.size());
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

void DebugCallbacks::onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) {
    if (get_auth_state() != AUTH_ESTABLISHED)
        return;

    NimBLEAttValue d = pCharacteristic->getValue();
    const uint8_t* data = d.data();

    if (validate_debug_level(data, d.size()))
        set_debug_level((ble_debug_level_t)data[0]);
}

void DebugCallbacks::onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) {
    if ((subValue & 0x0001) != 0)
        set_debug_subscribed(1);
    else
        set_debug_subscribed(0);
}
