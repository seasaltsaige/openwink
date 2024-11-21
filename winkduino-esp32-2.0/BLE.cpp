#include "NimBLEDevice.h"
#include "BLE.h"

#if !CONFIG_BT_NIMBLE_EXT_ADV
  #error Must enable extended advertising, see nimconfig.h file.
#endif



class WinkduinoBLE
{
  private:
    NimBLEServer* server;
    NimBLEService* service;
    NimBLEExtAdvertisement adv(primaryPhy, secondaryPhy);


    void initDeviceServer();
    void initServerService();
    void initServerCharacteristics();
    void initAdvertising();
  public:
    WinkduinoBLE(string deviceName)
    {
      NimBLEDevice::init(deviceName);
    }

    void initDevice();
    void start();
};