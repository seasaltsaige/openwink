#include "ble/ble.h"
#include "ble/ble_callbacks.h"
#include "ble/constants.h"
#include "handler/headlight_output.h"
#include <NimBLEDevice.h>
#include <string>


using namespace std;

bool BLE::device_connected = false;

NimBLEServer* BLE::server;

NimBLEExtAdvertising* BLE::advertising;
NimBLEExtAdvertisement BLE::advertisement;

NimBLEService* BLE::winkService;
NimBLECharacteristic* BLE::winkChar;
NimBLECharacteristic* BLE::busyChar;
NimBLECharacteristic* BLE::leftStatusChar;
NimBLECharacteristic* BLE::rightStatusChar;
NimBLECharacteristic* BLE::sleepChar;
NimBLECharacteristic* BLE::customCommandChar;
NimBLECharacteristic* BLE::syncChar;

NimBLEService* BLE::otaService;
NimBLECharacteristic* BLE::otaUpdateChar;
NimBLECharacteristic* BLE::firmwareStatus;
NimBLECharacteristic* BLE::firmwareChar;

NimBLEService* BLE::settingsService;
NimBLECharacteristic* BLE::longTermSleepChar;
NimBLECharacteristic* BLE::customButtonChar;
NimBLECharacteristic* BLE::headlightDelayChar;
NimBLECharacteristic* BLE::headlightMotionChar;
NimBLECharacteristic* BLE::sleepSettingsChar;
NimBLECharacteristic* BLE::unpairChar;
NimBLECharacteristic* BLE::resetChar;
NimBLECharacteristic* BLE::clientMacChar;

void BLE::init(string deviceName)
{
    NimBLEDevice::init(deviceName);
    NimBLEDevice::setMTU(BLE_ATT_MTU_MAX);
    startServer();
    startServices();
    startAdvertising(deviceName);
};

void BLE::startServer()
{
    server = NimBLEDevice::createServer();
    server->setCallbacks(new ServerCallbacks());
    printf("Set up BLE Server\n");
}

void BLE::startServices()
{
    // Wink related services and status
    winkService = server->createService(WINK_SERVICE_UUID);

    winkChar = winkService->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    sleepChar = winkService->createCharacteristic(SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE_NR);
    busyChar = winkService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
    leftStatusChar = winkService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    rightStatusChar = winkService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    // syncChar = winkService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE_NR);
    // customCommandChar = winkService->createCharacteristic(CUSTOM_COMMAND_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE_NR);

    winkChar->setCallbacks(new HeadlightMovementCharacteristicCallbacks());
    sleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());

    otaService = server->createService(OTA_SERVICE_UUID);

    // otaUpdateChar = otaService->createCharacteristic(OTA_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
    // firmwareChar = otaService->createCharacteristic(FIRMWARE_UUID, NIMBLE_PROPERTY::READ);
    // firmwareStatus = otaService->createCharacteristic(SOFTWARE_STATUS_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);


    settingsService = server->createService(MODULE_SETTINGS_SERVICE_UUID);

    // longTermSleepChar = settingsService->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE_NR);
    // customButtonChar = settingsService->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE_NR);
    // headlightDelayChar = settingsService->createCharacteristic(HEADLIGHT_MOVEMENT_DELAY_UUID, NIMBLE_PROPERTY::WRITE_NR);
    // headlightMotionChar = settingsService->createCharacteristic(HEADLIGHT_MOTION_IN_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    // sleepSettingsChar = settingsService->createCharacteristic(SLEEPY_SETTINGS_UUID, NIMBLE_PROPERTY::WRITE_NR | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
    // unpairChar = settingsService->createCharacteristic(UNPAIR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    // resetChar = settingsService->createCharacteristic(RESET_UUID, NIMBLE_PROPERTY::WRITE_NR);
    // clientMacChar = settingsService->createCharacteristic(CLIENT_MAC_UUID, NIMBLE_PROPERTY::WRITE_NR | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);

    // NOTE: Characteristics are commented out until callbacks are implemented

    printf("Setup BLE Services\n");
}

void BLE::startAdvertising(string name)
{
    winkService->start();
    otaService->start();
    settingsService->start();


    advertisement.setName(name);
    advertisement.setConnectable(true);
    advertisement.setScannable(false);

    // Want to do more research into this. Could help with crowded BLE/Bluetooth
    // classic environments perhaps
    // advertisement.setPrimaryChannels(true, false, false);

    advertisement.setPrimaryPhy(BLE_HCI_LE_PHY_1M);
    advertisement.setSecondaryPhy(BLE_HCI_LE_PHY_2M);

    advertisement.addServiceUUID(NimBLEUUID(WINK_SERVICE_UUID));
    advertisement.addServiceUUID(NimBLEUUID(OTA_SERVICE_UUID));
    advertisement.addServiceUUID(NimBLEUUID(MODULE_SETTINGS_SERVICE_UUID));
    advertisement.setTxPower(ESP_PWR_LVL_P9);


    advertising = NimBLEDevice::getAdvertising();
    if (advertising->setInstanceData(0, advertisement))
    {
        if (advertising->start(0))
        {
            printf("BLE Advertising success\n");
        }
        else
            printf("Failed to start advertising...\n");
    }
    else
        printf("Failed to set BLE Instance Data...\n");

    advertising->setCallbacks(new AdvertisingCallbacks());
}

void BLE::updateHeadlightStatus()
{
    leftStatusChar->setValue(to_string(HeadlightOutputHandler::HeadlightStatus::left).c_str());
    rightStatusChar->setValue(to_string(HeadlightOutputHandler::HeadlightStatus::right).c_str());

    leftStatusChar->notify();
    rightStatusChar->notify();
}


void INIT_nimble_device(string deviceName)
{
    BLE::init(deviceName);
}