#pragma once

#include <Preferences.h>
#include <NimBLEDevice.h>
#include <string>

#include "esp_system.h"
void generateToken(char out[21]);

enum SIDE {
  L,
  R,
};

using namespace std;
class Storage {
private:
  static Preferences storage;

public:
  static void begin(const char* name);
  static void getFromStorage();
  static void reset();

  static void setCustomOEMButtonStatus(bool status);
  static void setHeadlightMulti(double multi);
  static void setDelay(int delay);

  static void setCustomButtonPressArray(int index, string value);
  static void setSleepyValues(int side, double value);
  static void setHeadlightBypass(bool bypass);
  static void setHeadlightOrientation(bool orientation);
  static bool getHeadlightOrientation();

  static void setMotionIn(SIDE side, int timing);

  static void setBond(string passkey);
  static void resetBond();
  static string getBond();
  static bool hasBond();
};
