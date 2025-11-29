#pragma once


// #include "NimBLEConnInfo.h"
// #include "NimBLECharacteristic.h"
#include <vector>
#include <string>
#include "NimBLEServer.h"
#include <NimBLEDevice.h>

extern double headlightMultiplier;
extern bool otaUpdateRestartQueued;

using namespace std;
/**
  1 : Default (If UP, switch to DOWN; if DOWN, switch to UP)
  2 : Left Blink
  3 : Left Blink x2
  4 : Right Blink
  5 : Right Blink x2
  6 : Both Blink
  7 : Both Blink x2
  8 : Left Wave
  9 : Right Wave
 10 : ...
**/
extern vector<string> customButtonPressArray;
extern int maxTimeBetween_ms;
extern bool customButtonStatusEnabled;
extern int queuedCommand;
extern string queuedCustomCommand;

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override;
  void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override;
  // void onAuthenticationComplete(NimBLEConnInfo& connInfo) override;
  void onPhyUpdate(NimBLEConnInfo &connInfo, uint8_t txPhy, uint8_t rxPhy) override;
  void onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) override;
};

class LongTermSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class SyncCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class SleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class RequestCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class HeadlightCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class CustomButtonPressCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
  void onRead(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class HeadlightBypassCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class OTAUpdateCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class SleepSettingsCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class CustomCommandCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class UnpairCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class ResetCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class ClientMacCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

void handleHTTPClient();

class AdvertisingCallbacks : public NimBLEExtAdvertisingCallbacks {
  void onStopped(NimBLEExtAdvertising* pAdv, int reason, uint8_t inst_id);
};
