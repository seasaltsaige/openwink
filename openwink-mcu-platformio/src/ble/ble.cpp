#include "ble/ble.h"
#include "ble/ble_callbacks.h"
#include "ble/constants.h"
#include <NimBLEDevice.h>
#include <string>


using namespace std;

bool BLE::device_connected = false;

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
    NimBLEDevice::setMTU(BLE_ATT_MTU_MAX);
    startServer();
    startService();
    startAdvertising();
};

void BLE::startServer()
{
    server = NimBLEDevice::createServer();
    server->setCallbacks(new ServerCallbacks());
}

void BLE::startService()
{
    // Wink related services and status
    winkService = server->createService(WINK_SERVICE_UUID);

    winkChar = winkService->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    sleepChar = winkService->createCharacteristic(SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE_NR);
    busyChar = winkService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
    leftStatusChar = winkService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    rightStatusChar = winkService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    syncChar = winkService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE_NR);
    customCommandChar = winkService->createCharacteristic(CUSTOM_COMMAND_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE_NR);


    otaService = server->createService(OTA_SERVICE_UUID);

    otaUpdateChar = otaService->createCharacteristic(OTA_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
    firmwareChar = otaService->createCharacteristic(FIRMWARE_UUID, NIMBLE_PROPERTY::READ);
    firmwareStatus = otaService->createCharacteristic(SOFTWARE_STATUS_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);


    settingsService = server->createService(MODULE_SETTINGS_SERVICE_UUID);

    longTermSleepChar = settingsService->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE_NR);
    customButtonChar = settingsService->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE_NR);
    headlightDelayChar = settingsService->createCharacteristic(HEADLIGHT_MOVEMENT_DELAY_UUID, NIMBLE_PROPERTY::WRITE_NR);
    headlightMotionChar = settingsService->createCharacteristic(HEADLIGHT_MOTION_IN_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
    sleepSettingsChar = settingsService->createCharacteristic(SLEEPY_SETTINGS_UUID, NIMBLE_PROPERTY::WRITE_NR | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
    unpairChar = settingsService->createCharacteristic(UNPAIR_UUID, NIMBLE_PROPERTY::WRITE_NR);
    resetChar = settingsService->createCharacteristic(RESET_UUID, NIMBLE_PROPERTY::WRITE_NR);
    clientMacChar = settingsService->createCharacteristic(CLIENT_MAC_UUID, NIMBLE_PROPERTY::WRITE_NR | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
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