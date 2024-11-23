#pragma once

#include <Preferences.h>

class Storage {
  private:
    static Preferences storage;

  public:
    static void begin(const char* name);
    static void getFromStorage();
    
    static void setHeadlightMulti(double multi);
    static void setCustomButtonPressArrayDefaults(int defaults[10]);
    static void setDelay(int delay);
};