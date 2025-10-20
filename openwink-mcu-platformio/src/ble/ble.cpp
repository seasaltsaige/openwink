#include "ble/ble.h"

#include <NimBLEDevice.h>

#include <string>

#include "ble/constants.h"

using namespace std;

NimBLEServer* BLE::server;

NimBLEExtAdvertising* BLE::advertising;

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
    startServer();
    startService();
    startAdvertising();
};

void BLE::startServer()
{
    server = NimBLEDevice::createServer();
}

void BLE::startService()
{
    //
    winkService = server->createService(WINK_SERVICE_UUID);

    winkChar = winkService->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    sleepChar = winkService->createCharacteristic(SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE_NR);

    busyChar = winkService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
    leftStatusChar = winkService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    rightStatusChar = winkService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    syncChar = winkService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE_NR);
    customCommandChar = winkService->createCharacteristic(CUSTOM_COMMAND_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE_NR);

    otaService = server->createService(OTA_SERVICE_UUID);

    settingsService = server->createService(MODULE_SETTINGS_SERVICE_UUID);
}

void BLE::startDevice()
{
}

void BLE::startAdvertising()
{
}

void INIT_nimble_device(string deviceName)
{
    BLE::init(deviceName);
    vTaskDelay(pdMS_TO_TICKS(20));
    BLE::startDevice();
}