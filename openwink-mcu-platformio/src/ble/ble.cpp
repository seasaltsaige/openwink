#include "ble/ble.h"
#include "ble/constants.h"

#include <NimBLEDevice.h>
#include <string>

using namespace std;

NimBLEServer *BLE::server;

NimBLEExtAdvertising *BLE::advertising;

NimBLEService *BLE::winkService;
NimBLECharacteristic *BLE::winkChar;
NimBLECharacteristic *BLE::busyChar;
NimBLECharacteristic *BLE::leftStatusChar;
NimBLECharacteristic *BLE::rightStatusChar;
NimBLECharacteristic *BLE::sleepChar;
NimBLECharacteristic *BLE::customCommandChar;
NimBLECharacteristic *BLE::syncChar;

NimBLEService *BLE::otaService;
NimBLECharacteristic *BLE::otaUpdateChar;
NimBLECharacteristic *BLE::firmwareStatus;
NimBLECharacteristic *BLE::firmwareChar;

NimBLEService *BLE::settingsService;
NimBLECharacteristic *BLE::longTermSleepChar;
NimBLECharacteristic *BLE::customButtonChar;
NimBLECharacteristic *BLE::headlightDelayChar;
NimBLECharacteristic *BLE::headlightMotionChar;
NimBLECharacteristic *BLE::sleepSettingsChar;
NimBLECharacteristic *BLE::unpairChar;
NimBLECharacteristic *BLE::resetChar;
NimBLECharacteristic *BLE::clientMacChar;

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