#ifndef _STORAGE_H
#define _STORAGE_H
#include <Preferences.h>

class Storage {
  private:
    static Preferences storage;

  public:
    Storage() = delete;
    static void begin(const char* name);
    static void setFromStorage();
    
    static void setHeadlightMulti();



};


#endif