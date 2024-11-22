#ifndef _BLECALLBACKS_H
#define _BLECALLBACKS_H

#include <NimBLEDevice.h>


bool deviceConnected = false;
int awakeTime_ms = 0;
double headlightMultiplier = 1.0;

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
RTC_DATA_ATTR int customButtonPressArray[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
RTC_DATA_ATTR int maxTimeBetween_ms = 500;

class ServerCallbacks : public NimBLEServerCallbacks {};
class LongTermSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class SyncCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class LeftSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class RightSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class RequestCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class HeadlightCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class CustomButtonPressCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class OTAUpdateCharacteristicCallbacks : public NimBLECharacteristicCallbacks {};
class AdvertisingCallbacks : public NimBLEExtAdvertisingCallbacks {};

#endif