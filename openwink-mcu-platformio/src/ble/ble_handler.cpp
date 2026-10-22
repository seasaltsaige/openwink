#include <NimBLEDevice.h>
#include <vector>

#include "ble/ble_callbacks.hpp"
#include "ble/ble_handler.h"
#include "command_output.h"
#include "headlight_feedback.h"
#include "output_handler.h"
#include "sleep_handler.h"

static NimBLEServer* openwink_server = nullptr;
static volatile bool ble_initialized = false;

static NimBLEService* wink_service = nullptr;
static NimBLEService* ota_service = nullptr;
static NimBLEService* settings_service = nullptr;

static NimBLEExtAdvertising* advertising = nullptr;

static ServerCallbacks server_callbacks;
static AdvertisingCallbacks advertising_callbacks;

static HeadlightCommandCallbacks default_cmd_callbacks;
static HeadlightStatusCallbacks status_callbacks;
static CustomCommandCallbacks custom_cmd_callbacks;


static CustomButtonCallbacks custom_btn_callbacks;
static AuxSettingsCallbacks aux_settings_callbacks;
static GeneralSettingsCallbacks settings_callbacks;

static AuthCallbacks auth_callbacks;
static DebugCallbacks debug_callbacks;

SemaphoreHandle_t status_lock;
openwink_status_t openwink_status = DISCONNECTED;

void set_device_status(openwink_status_t status) {
    xSemaphoreTake(status_lock, portMAX_DELAY);
    openwink_status = status;
    xSemaphoreGive(status_lock);
}

openwink_status_t get_device_status() {
    if (openwink_status == CONNECTED)
        return CONNECTED;
    if (openwink_server != nullptr && openwink_server->getConnectedCount() > 0)
        return CONNECTED;
    return openwink_status;
}


extern "C" uint8_t ble_init(const char* name) {
    if (status_lock == NULL)
        status_lock = xSemaphoreCreateMutex();

    std::string n = std::string(name);
    bool success = NimBLEDevice::init(name);

    if (!success)
        return BLE_INIT_FAILURE;

    NimBLEDevice::setMTU(MAX_ATT_MTU);

    NimBLEDevice::setPower(ESP_PWR_LVL_P9);

    openwink_server = NimBLEDevice::createServer();
    openwink_server->setCallbacks(&server_callbacks);

    wink_service = openwink_server->createService(WINK_SERVICE_UUID);
    ota_service = openwink_server->createService(OTA_SERVICE_UUID);
    settings_service = openwink_server->createService(MODULE_SETTINGS_SERVICE_UUID);


    wink_service->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    wink_service->getCharacteristic(HEADLIGHT_CHAR_UUID)->setCallbacks(&default_cmd_callbacks);

    wink_service->createCharacteristic(HEADLIGHT_STATUS_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
    wink_service->getCharacteristic(HEADLIGHT_STATUS_UUID)->setCallbacks(&status_callbacks);

    wink_service->createCharacteristic(CUSTOM_COMMAND_UUID, NIMBLE_PROPERTY::WRITE_NR);
    wink_service->getCharacteristic(CUSTOM_COMMAND_UUID)->setCallbacks(&custom_cmd_callbacks);

    settings_service->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE);
    settings_service->getCharacteristic(CUSTOM_BUTTON_UPDATE_UUID)->setCallbacks(&custom_btn_callbacks);

    settings_service->createCharacteristic(AUX_BUTTONS_UUID, NIMBLE_PROPERTY::WRITE);
    settings_service->getCharacteristic(AUX_BUTTONS_UUID)->setCallbacks(&aux_settings_callbacks);

    settings_service->createCharacteristic(GENERAL_SETTINGS_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY);
    settings_service->getCharacteristic(GENERAL_SETTINGS_UUID)->setCallbacks(&settings_callbacks);

    settings_service->createCharacteristic(PASSKEY_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY);
    settings_service->getCharacteristic(PASSKEY_UUID)->setCallbacks(&auth_callbacks);

    settings_service->createCharacteristic(DEBUG_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY);
    settings_service->getCharacteristic(DEBUG_UUID)->setCallbacks(&debug_callbacks);

    ble_initialized = true;
    ble_notify_headlight_status();

    return BLE_INIT_SUCCESS;
}


extern "C" void begin_advertising() {

    // if advertising has been started previously before reboot/deep sleep
    // just start it again.
    if (advertising != nullptr && advertising->start(0)) {
        reset_sleep_timer_on_advertising();
        return;
    }

    openwink_server->start();

    NimBLEExtAdvertisement adv;

    adv.setFlags(BLE_HS_ADV_F_DISC_GEN);
    adv.setName(std::string(DEVICE_NAME));

    adv.setConnectable(true);
    adv.setScannable(false);

    adv.setPrimaryPhy(BLE_HCI_LE_PHY_1M);
    adv.setSecondaryPhy(BLE_HCI_LE_PHY_2M);

    adv.addServiceUUID(WINK_SERVICE_UUID);
    adv.addServiceUUID(OTA_SERVICE_UUID);
    adv.addServiceUUID(MODULE_SETTINGS_SERVICE_UUID);

    advertising = NimBLEDevice::getAdvertising();
    advertising->setCallbacks(&advertising_callbacks);

    if (advertising->setInstanceData(0, adv)) {
        if (advertising->start(0)) {
            reset_sleep_timer_on_advertising();
            printf("Advertising started\n");
        } else {
            printf("Failed to start advertising\n");
        }
    } else {
        printf("Failed to register advertisement\n");
    }
}


extern "C" void ble_disconnect() {
    if (openwink_status == DISCONNECTED)
        return;

    NimBLEServer* pServer = NimBLEDevice::getServer();

    if (pServer && pServer->getConnectedCount() > 0) {
        std::vector<uint16_t> peerIds = pServer->getPeerDevices();

        if (!peerIds.empty())
            pServer->disconnect(peerIds[0]);
    }

    set_device_status(DISCONNECTED);
}

extern "C" void ble_notify_passkey(uint8_t* key, size_t size) {
    if (!ble_initialized || openwink_status == DISCONNECTED)
        return;

    NimBLEServer* pServer = NimBLEDevice::getServer();
    if (pServer == NULL)
        return;

    NimBLEService* settings = pServer->getServiceByUUID(MODULE_SETTINGS_SERVICE_UUID);
    if (settings == NULL)
        return;

    NimBLECharacteristic* passkey = settings->getCharacteristic(PASSKEY_UUID);
    if (passkey == NULL)
        return;

    passkey->setValue(key, size);
    passkey->notify();
}

extern "C" void ble_notify_debug(const uint8_t* data, size_t size) {
    if (!ble_initialized || openwink_status == DISCONNECTED)
        return;

    NimBLEServer* pServer = NimBLEDevice::getServer();
    if (pServer == NULL)
        return;

    NimBLEService* settings = pServer->getServiceByUUID(MODULE_SETTINGS_SERVICE_UUID);
    if (settings == NULL)
        return;

    NimBLECharacteristic* debug_char = settings->getCharacteristic(DEBUG_UUID);
    if (debug_char == NULL)
        return;

    debug_char->notify(data, size);
}

extern "C" void ble_notify_general_settings(const uint8_t* data, size_t size) {
    if (!ble_initialized || openwink_status == DISCONNECTED || data == NULL || size == 0)
        return;

    NimBLEServer* pServer = NimBLEDevice::getServer();
    if (pServer == NULL)
        return;

    NimBLEService* settings = pServer->getServiceByUUID(MODULE_SETTINGS_SERVICE_UUID);
    if (settings == NULL)
        return;

    NimBLECharacteristic* settings_char = settings->getCharacteristic(GENERAL_SETTINGS_UUID);
    if (settings_char == NULL)
        return;

    settings_char->setValue(data, size);
    settings_char->notify(data, size);
}

extern "C" void ble_notify_headlight_status() {
    if (!ble_initialized)
        return;

    NimBLEServer* pServer = NimBLEDevice::getServer();
    if (pServer == NULL)
        return;

    NimBLEService* wink = pServer->getServiceByUUID(WINK_SERVICE_UUID);
    if (wink == NULL)
        return;

    NimBLECharacteristic* status_char = wink->getCharacteristic(HEADLIGHT_STATUS_UUID);
    if (status_char == NULL)
        return;

    headlight_position_t pos = get_position();
    headlight_status_packet_t payload = {
        .busy = get_command_busy(),
        .left_pos = pos.left_pos,
        .right_pos = pos.right_pos,
        .left_move_time = get_left_move_time_ms(),
        .right_move_time = get_right_move_time_ms(),
    };

    status_char->setValue((const uint8_t*)&payload, sizeof(payload));

    if (openwink_status == CONNECTED)
        status_char->notify((const uint8_t*)&payload, sizeof(payload));
}
