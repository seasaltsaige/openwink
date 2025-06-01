#pragma once

#include "NimBLEServer.h"
#include <NimBLEDevice.h>
#include <WebServer.h>

extern double headlightMultiplier;

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
extern int customButtonPressArray[10];
extern int maxTimeBetween_ms;
extern bool customButtonStatusEnabled;

extern bool wifi_enabled;

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer);
  void onDisconnect(NimBLEServer* pServer);
};

class LongTermSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class SyncCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class LeftSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

class RightSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
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
};

class OTAUpdateCharacteristicCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& info) override;
};

void handleHTTPClient();

class AdvertisingCallbacks : public NimBLEExtAdvertisingCallbacks {
  void onStopped(NimBLEExtAdvertising *pAdv, int reason, uint8_t inst_id);
};
