#include <string.h>
#include "Storage.h"
#include "constants.h"
#include "BLECallbacks.h"

using namespace std;

Preferences Storage::storage;

void Storage::begin(const char *name) {
  storage.begin(name, false);
}

void Storage::getFromStorage() {
  char key[15];  

  for (int i = 0; i < 10; i++) {
    snprintf(key, sizeof(key), "presses-%d", i); 
    int val = storage.getUInt(key, customButtonPressArrayDefaults[i]);
    customButtonPressArray[i] = val;
  }

  const char *delayKey = "delay-key";
  int del = storage.getUInt(delayKey, maxTimeBetween_msDefault);
  maxTimeBetween_ms = del;

  const char *headlightKey = "headlight-key";
  double head = storage.getDouble(headlightKey, 1.0);
  headlightMultiplier = head;

  const char *customOemKey = "oem-button-key";
  bool oem = storage.getBool(customOemKey, false);
  customButtonStatusEnabled = oem;
}

void Storage::setCustomOEMButtonStatus(bool status) {
  const char *customOemKey = "oem-button-key";
  storage.putBool(customOemKey, status);
}

void Storage::setCustomButtonPressArrayDefaults(int defaults[10]) {
    for (int i = 0; i < 10; i++) {
    string key = "presses-";
    key = key + to_string(i);
    int val = storage.getUInt(key.c_str(), customButtonPressArrayDefaults[i]);
    if (val != defaults[i])
      storage.putUInt(key.c_str(), defaults[i]);
  }
}

void Storage::setDelay(int delay) {
  
  string delayKey = "delay-key";
  int storedDelay = storage.getUInt(delayKey.c_str(), maxTimeBetween_msDefault);
  if (delay != storedDelay)
    storage.putUInt(delayKey.c_str(), delay);
}

void Storage::setHeadlightMulti(double multi) {
  const char* headlightKey = "headlight-key";
  storage.putDouble(headlightKey, multi);
}
