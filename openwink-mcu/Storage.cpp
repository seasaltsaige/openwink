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


  const char *leftSleepyHeadlightKey = "sleepy-left";
  const char *rightSleepyHeadligthKey = "sleepy-right";
  double left = storage.getDouble(leftSleepyHeadlightKey, 50);
  double right = storage.getDouble(rightSleepyHeadligthKey, 50);
  leftSleepyValue = left;
  rightSleepyValue = right;

  // const char *motionKey = "motion-key";
  // int motion = storage.getInt(motionKey, 750);
  // HEADLIGHT_MOVEMENT_DELAY = motion;
}

void Storage::reset() {
  const char *customOemKey = "oem-button-key";
  storage.remove(customOemKey);
  const char *delayKey = "delay-key";
  storage.remove(delayKey);
  const char *headlightKey = "headlight-key";
  storage.remove(headlightKey);
  const char *leftSleepyHeadlightKey = "sleepy-left";
  storage.remove(leftSleepyHeadlightKey);
  const char *rightSleepyHeadlightKey = "sleepy-right";
  storage.remove(rightSleepyHeadlightKey);
  char pressesKey[15];  

  for (int i = 0; i < 10; i++) {
    snprintf(pressesKey, sizeof(pressesKey), "presses-%d", i);
    storage.remove(pressesKey);
  }

  customButtonStatusEnabled = false;
  maxTimeBetween_ms = 500;
  headlightMultiplier = 1.0;
  leftSleepyValue = 50;
  rightSleepyValue = 50;

  for (int i = 0; i < 10; i++) { 
    customButtonPressArray[i] = customButtonPressArrayDefaults[i];
  }

}

void Storage::setCustomOEMButtonStatus(bool status) {
  const char *customOemKey = "oem-button-key";
  storage.putBool(customOemKey, status);
}

void Storage::setCustomButtonPressArray(int index, int value) {
  string key = "presses-" + to_string(index); 
  int storedVal = storage.getUInt(key.c_str(), customButtonPressArrayDefaults[index]);
  if (storedVal != value) 
    storage.putUInt(key.c_str(), value);
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

// side = 0 -> left ::: side = 1 -> right
void Storage::setSleepyValues(int side, double value) {
  const char *leftSleepyHeadlightKey = "sleepy-left";
  const char *rightSleepyHeadligthKey = "sleepy-right";

  if (side == 0) {
    storage.putDouble(leftSleepyHeadlightKey, value);
  } else if (side == 1) {
    storage.putDouble(rightSleepyHeadligthKey, value);
  }
}

void Storage::setWhitelist(string mac) {
  const char *whitelistKey = "whitelist";
  // storage.putBool(whitelistKey, true);
  storage.putString(whitelistKey, mac.c_str());
}

void Storage::clearWhitelist() {
  const char *whitelistKey = "whitelist";
  storage.remove(whitelistKey);
}

string Storage::getWhitelist() {
  const char *whitelistKey = "whitelist";
  String stored = storage.getString(whitelistKey, "");
  return string(stored.c_str());
}

// void Storage::setMotionTiming(int time) {
//   const char* motionKey = "motion-key";
//   storage.putInt(motionKey, time);
// }