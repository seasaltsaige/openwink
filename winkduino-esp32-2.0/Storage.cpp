#include "Storage.h"
#include "constants.h"
#include "BLECallbacks.h"

void Storage::begin(const char *name) {
  storage.begin(name, false);
}

void Storage::setFromStorage() {
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
}
