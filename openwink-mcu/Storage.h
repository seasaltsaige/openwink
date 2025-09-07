#pragma once

#include <Preferences.h>
#include <NimBLEDevice.h>
using namespace std;
class Storage {
private:
  static Preferences storage;

public:
  static void begin(const char* name);
  static void getFromStorage();

  static void setCustomOEMButtonStatus(bool status);
  static void setHeadlightMulti(double multi);
  static void setDelay(int delay);
  static void setMotionTiming(int time);
  static void setCustomButtonPressArray(int index, int value);
  static void setSleepyValues(int side, double value);
  static void setWhitelist(string mac);
  static void clearWhitelist();
  static string getWhitelist();
};