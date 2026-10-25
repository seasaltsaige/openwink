#ifndef BLE_CALLBACKS_HPP
#define BLE_CALLBACKS_HPP

#include <NimBLEDevice.h>

class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override;
    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override;
    void onPhyUpdate(NimBLEConnInfo& connInfo, uint8_t txPhy, uint8_t rxPhy) override;
    void onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) override;
};

class AdvertisingCallbacks : public NimBLEExtAdvertisingCallbacks {
    void onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t instId) override;
};

class HeadlightCommandCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

class HeadlightStatusCallbacks : public NimBLECharacteristicCallbacks {
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override;
};

class CustomCommandCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

class CustomButtonCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

class AuxSettingsCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

class GeneralSettingsCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};

class AuthCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override;
};

class DebugCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override;
};

class OTAControlCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override;
};

class OTADataCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override;
};


#endif