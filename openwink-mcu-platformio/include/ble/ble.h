#ifndef __BLE
#define __BLE

#include <NimBLEDevice.h>
#include <NimBLEExtAdvertising.h>
#include <NimBLEServer.h>
#include <string>

class BLE
{
  public:
    static void init(std::string name);

    static bool getClientConnected()
    {
        return device_connected;
    };

    static void startDevice();

  private:
    static NimBLEServer *server;

    static NimBLEExtAdvertisement advertisement;
    static NimBLEExtAdvertising *advertising;

    static NimBLEService *winkService;
    // WINK CHARACTERISTICS
    static NimBLECharacteristic *winkChar;
    static NimBLECharacteristic *busyChar;
    static NimBLECharacteristic *leftStatusChar;
    static NimBLECharacteristic *rightStatusChar;
    static NimBLECharacteristic *sleepChar;
    static NimBLECharacteristic *customCommandChar;
    static NimBLECharacteristic *syncChar;

    static NimBLEService *otaService;
    // OTA CHARACTERISTICS
    static NimBLECharacteristic *otaUpdateChar;
    static NimBLECharacteristic *firmwareStatus;
    static NimBLECharacteristic *firmwareChar;

    static NimBLEService *settingsService;
    // SETTINGS CHARACTERISTICS
    static NimBLECharacteristic *longTermSleepChar;
    static NimBLECharacteristic *customButtonChar;
    static NimBLECharacteristic *headlightDelayChar;
    static NimBLECharacteristic *headlightMotionChar;
    static NimBLECharacteristic *sleepSettingsChar;
    static NimBLECharacteristic *unpairChar;
    static NimBLECharacteristic *resetChar;

    static NimBLECharacteristic *clientMacChar;

    static bool device_connected;
    static void startServer();
    static void startService();
    static void startAdvertising();
    // static void
};

void INIT_nimble_device(std::string name);

#endif