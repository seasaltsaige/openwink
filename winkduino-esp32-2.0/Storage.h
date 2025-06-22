#pragma once

#include <Preferences.h>

class Storage {
private:
  static Preferences storage;

public:
  static void begin(const char* name);
  static void getFromStorage();

  static void setCustomOEMButtonStatus(bool status);
  static void setHeadlightMulti(double multi);
  static void setCustomButtonPressArrayDefaults(int defaults[10]);
  static void setDelay(int delay);
  static void setMotionTiming(int time);
};