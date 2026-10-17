#include <NimBLEDevice.h>
#include <vector>

#include "ble/ble_callbacks.hpp"
#include "ble/ble_handler.h"

static NimBLEServer* openwink_server = nullptr;

static NimBLEService* wink_service = nullptr;
static NimBLEService* ota_service = nullptr;
static NimBLEService* settings_service = nullptr;

static NimBLEExtAdvertising* advertising = nullptr;

static ServerCallbacks server_callbacks;
static HeadlightCommandCallbacks default_cmd_callbacks;
static CustomCommandCallbacks custom_cmd_callbacks;

SemaphoreHandle_t status_lock;
openwink_status_t openwink_status = DISCONNECTED;

void set_device_status(openwink_status_t status) {
    xSemaphoreTake(status_lock, portMAX_DELAY);
    openwink_status = status;
    xSemaphoreGive(status_lock);
}

openwink_status_t get_device_status() {
    return openwink_status;
}


extern "C" uint8_t ble_init(const char* name) {
    if (status_lock == NULL)
        status_lock = xSemaphoreCreateMutex();

    // xSemaphoreTake(statu)
    // keep track
    // if (openwink_status != DISCONNECTED)
    // return BLE_INIT_ALREADY_INITIALIZED;

    std::string n = std::string(name);
    bool success = NimBLEDevice::init(name);

    if (!success)
        return BLE_INIT_FAILURE;

    NimBLEDevice::setMTU(MAX_ATT_MTU);

    openwink_server = NimBLEDevice::createServer();
    openwink_server->setCallbacks(&server_callbacks);

    wink_service = openwink_server->createService(WINK_SERVICE_UUID);
    ota_service = openwink_server->createService(OTA_SERVICE_UUID);
    settings_service = openwink_server->createService(MODULE_SETTINGS_SERVICE_UUID);


    wink_service->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    wink_service->getCharacteristic(HEADLIGHT_CHAR_UUID)->setCallbacks(&default_cmd_callbacks);

    wink_service->createCharacteristic(CUSTOM_COMMAND_UUID, NIMBLE_PROPERTY::WRITE_NR);
    wink_service->getCharacteristic(CUSTOM_COMMAND_UUID)->setCallbacks(&custom_cmd_callbacks);


    return BLE_INIT_SUCCESS;
}


extern "C" void begin_advertising() {
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

    if (advertising->setInstanceData(0, adv))
        if (advertising->start(0))
            printf("Advertising started\n");
        else
            printf("Failed to start advertising\n");
    else
        printf("Failed to register advertisement\n");
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