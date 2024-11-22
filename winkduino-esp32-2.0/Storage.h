#ifndef _STORAGE_H
#define _STORAGE_H
#include <Preferences.h>

class Storage {
  private:
    static Preferences storage;

  public:
    Storage() = delete;
    static void begin(const char* name);
    static void getFromStorage();
    
    static void setHeadlightMulti(double multi);
    static void setCustomButtonPressArrayDefaults(int[10] defaults);
    static void setDelay(int delay);
};


#endif