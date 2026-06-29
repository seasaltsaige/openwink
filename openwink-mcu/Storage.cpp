#include <string.h>
#include "Storage.h"
#include "constants.h"
#include "BLECallbacks.h"
#include "ButtonHandler.h"
#include "AuxHandler.h"
#include <string>
using namespace std;

const char charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

void generateToken(char key[21]) {
  static const uint8_t charsetSize = 62;

  uint8_t randByte;
  int idx = 0;

  while (idx < 20) {
    esp_fill_random(&randByte, 1);
    if (randByte < (256 / charsetSize) * charsetSize) {
      key[idx++] = charset[randByte % charsetSize];
    }
  }

  key[20] = '\0';
}


Preferences Storage::storage;

void Storage::begin(const char *name) {
  storage.begin(name, false);
}

void Storage::getFromStorage() {
  char key[15];

  for (int i = 0; i < 20; i++) {
    snprintf(key, sizeof(key), "presses-%d", i);
    String val = storage.getString(key, String(customButtonPressArrayDefaults[i].c_str()));
    customButtonPressArray[i] = string(val.c_str());
  }

  // Get loop data from storage
  for (int i = 0; i < 9; i++) {
    snprintf(key, sizeof(key), "loop-%d", i);
    bool value = storage.getBool(key, false);
    customButtonPressLoopArray[i] = value;
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

  const char *headlightBypassKey = "hl-bypass";
  bool bypass = storage.getBool(headlightBypassKey);
  bypassHeadlightOverride = bypass;

  const char *auxKey = "aux-buttons";
  bool auxEnabled = storage.getBool(auxKey);
  // Set aux enable status
  AuxHandler::setAuxiliaryButtonsStatus(auxEnabled);

  const char *auxKey1 = "aux-side-1";
  const char *auxKey2 = "aux-side-2";
  const char *auxLoopKey1 = "aux-loop-1";
  const char *auxLoopKey2 = "aux-loop-2";
  const char *auxBtnTypeKey1 = "aux-type-1";
  const char *auxBtnTypeKey2 = "aux-type-2";


  // left wink default
  String aux1 = storage.getString(auxKey1, String("2"));
  // right wink default
  String aux2 = storage.getString(auxKey2, String("4"));

  bool loop1 = storage.getBool(auxLoopKey1, false);
  bool loop2 = storage.getBool(auxLoopKey2, false);

  int type1 = storage.getInt(auxBtnTypeKey1, 0);
  int type2 = storage.getInt(auxBtnTypeKey2, 0);

  AuxHandler::setAuxSideAction(1, string(aux1.c_str()));
  AuxHandler::setAuxSideAction(2, string(aux2.c_str()));
  AuxHandler::setAuxLoop(1, loop1);
  AuxHandler::setAuxLoop(2, loop2);
  AuxHandler::setAuxType(1, type1);
  AuxHandler::setAuxType(2, type2);


  const char *leftSleepyHeadlightKey = "sleepy-left";
  const char *rightSleepyHeadligthKey = "sleepy-right";
  double left = storage.getDouble(leftSleepyHeadlightKey, 50);
  double right = storage.getDouble(rightSleepyHeadligthKey, 50);
  leftSleepyValue = left;
  rightSleepyValue = right;

  string orientationKey = "orien-key";
  bool storedOrientationValue = storage.getBool(orientationKey.c_str(), false);

  if (storedOrientationValue) {
    OUT_PIN_LEFT_DOWN = 12;
    OUT_PIN_LEFT_UP = 13;
    OUT_PIN_RIGHT_DOWN = 10;
    OUT_PIN_RIGHT_UP = 11;

    OEM_HEADLIGHT_STATUS_RIGHT = 3;
    OEM_HEADLIGHT_STATUS_LEFT = 46;
  } else {
    OUT_PIN_LEFT_DOWN = 10;
    OUT_PIN_LEFT_UP = 11;
    OUT_PIN_RIGHT_DOWN = 12;
    OUT_PIN_RIGHT_UP = 13;

    OEM_HEADLIGHT_STATUS_RIGHT = 46;
    OEM_HEADLIGHT_STATUS_LEFT = 3;
  }

  const char *leftMotion = "motion-left-timing";
  const char *rightMotion = "motion-right-timing";
  int leftMove = storage.getInt(leftMotion, HEADLIGHT_MOVEMENT_DELAY);
  int rightMove = storage.getInt(rightMotion, HEADLIGHT_MOVEMENT_DELAY);
  ButtonHandler::leftMoveTime = leftMove;
  ButtonHandler::rightMoveTime = rightMove;
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
  const char *headlightBypassKey = "hl-bypass";
  storage.remove(headlightBypassKey);
  const char *orientationKey = "orien-key";
  storage.remove(orientationKey);

  const char *leftMotion = "motion-left-timing";
  const char *rightMotion = "motion-right-timing";
  storage.remove(leftMotion);
  storage.remove(rightMotion);

  const char *auxKey = "aux-buttons";
  storage.remove(auxKey);
  AuxHandler::setAuxiliaryButtonsStatus(false);

  const char *auxKey1 = "aux-side-1";
  const char *auxKey2 = "aux-side-2";
  const char *auxLoopKey1 = "aux-loop-1";
  const char *auxLoopKey2 = "aux-loop-2";
  const char *auxBtnTypeKey1 = "aux-type-1";
  const char *auxBtnTypeKey2 = "aux-type-2";

  storage.remove(auxKey1);
  storage.remove(auxKey2);
  storage.remove(auxLoopKey1);
  storage.remove(auxLoopKey2);
  storage.remove(auxBtnTypeKey1);
  storage.remove(auxBtnTypeKey2);
  AuxHandler::setAuxSideAction(1, string("6"));
  AuxHandler::setAuxSideAction(2, string("9"));
  AuxHandler::setAuxLoop(1, false);
  AuxHandler::setAuxLoop(2, false);
  AuxHandler::setAuxType(1, 0);
  AuxHandler::setAuxType(2, 0);

  char pressesKey[15];

  for (int i = 0; i < 10; i++) {
    snprintf(pressesKey, sizeof(pressesKey), "presses-%d", i);
    storage.remove(pressesKey);
  }

  for (int i = 0; i < 9; i++) {
    snprintf(pressesKey, sizeof(pressesKey), "loop-%d", i);
    storage.remove(pressesKey);
  }

  Storage::resetBond();

  customButtonStatusEnabled = false;
  maxTimeBetween_ms = 500;
  headlightMultiplier = 1.0;
  leftSleepyValue = 50;
  rightSleepyValue = 50;

  OUT_PIN_LEFT_DOWN = 10;
  OUT_PIN_LEFT_UP = 11;
  OUT_PIN_RIGHT_DOWN = 12;
  OUT_PIN_RIGHT_UP = 13;

  OEM_HEADLIGHT_STATUS_RIGHT = 46;
  OEM_HEADLIGHT_STATUS_LEFT = 3;

  for (int i = 0; i < 9; i++) {
    customButtonPressArray[i] = customButtonPressArrayDefaults[i];
  }
}

void Storage::setMotionIn(SIDE side, int timing) {
  string s = side == SIDE::L ? "left" : "right";
  string key = "motion-" + s + "-timing";
  int t = storage.getInt(static_cast<const char *>(key.c_str()), HEADLIGHT_MOVEMENT_DELAY);
  if (side == SIDE::L && timing == t || side == SIDE::R && timing == t) return;

  storage.putInt(static_cast<const char *>(key.c_str()), timing);
}

void Storage::setAuxStatus(bool enabled) {
  const char *auxKey = "aux-buttons";
  storage.putBool(auxKey, enabled);
}

void Storage::setAuxAction(int aux, string value) {
  string auxSideKey = "aux-side-" + to_string(aux);
  storage.putString(auxSideKey.c_str(), String(value.c_str()));
}


void Storage::setAuxLooping(int aux, bool looping) {
  string auxLoopKey = "aux-loop-" + to_string(aux);
  storage.putBool(auxLoopKey.c_str(), looping);
}
void Storage::setAuxButtonType(int aux, int type) {
  string auxBtnTypeKey = "aux-type-" + to_string(aux);
  storage.putInt(auxBtnTypeKey.c_str(), type);
}

void Storage::setCustomOEMButtonStatus(bool status) {
  const char *customOemKey = "oem-button-key";
  storage.putBool(customOemKey, status);
}

void Storage::setCustomButtonPressArray(int index, string value) {
  string key = "presses-" + to_string(index);
  String storedVal = storage.getString(key.c_str(), String(customButtonPressArrayDefaults[index].c_str()));
  if (string(storedVal.c_str()) != value)
    storage.putString(key.c_str(), value.c_str());
}

void Storage::setCustomButtonPressLoop(int index, bool loop) {
  string key = "loop-" + to_string(index);
  storage.putBool(key.c_str(), loop);
}


void Storage::setHeadlightBypass(bool value) {
  const char *key = "hl-bypass";
  storage.putBool(key, value);
}

// TRUE = OUTSIDE
// FALSE (DEFAULT) = CABIN
void Storage::setHeadlightOrientation(bool orientation) {
  string key = "orien-key";
  storage.putBool(key.c_str(), orientation);


  if (orientation) {
    OUT_PIN_LEFT_DOWN = 12;
    OUT_PIN_LEFT_UP = 13;
    OUT_PIN_RIGHT_DOWN = 10;
    OUT_PIN_RIGHT_UP = 11;

    OEM_HEADLIGHT_STATUS_RIGHT = 3;
    OEM_HEADLIGHT_STATUS_LEFT = 46;

  } else {
    OUT_PIN_LEFT_DOWN = 10;
    OUT_PIN_LEFT_UP = 11;
    OUT_PIN_RIGHT_DOWN = 12;
    OUT_PIN_RIGHT_UP = 13;

    OEM_HEADLIGHT_STATUS_RIGHT = 46;
    OEM_HEADLIGHT_STATUS_LEFT = 3;
  }
}

bool Storage::getHeadlightOrientation() {
  string orien_key = "orien-key";
  bool storedValue = storage.getBool(orien_key.c_str(), false);
  return storedValue;
}

void Storage::setDelay(int delay) {

  string delayKey = "delay-key";
  int storedDelay = storage.getUInt(delayKey.c_str(), maxTimeBetween_msDefault);
  if (delay != storedDelay)
    storage.putUInt(delayKey.c_str(), delay);
}

void Storage::setHeadlightMulti(double multi) {
  const char *headlightKey = "headlight-key";
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

void Storage::setBond(string passkey) {
  const char *key = "passkey";
  String value = storage.getString(key, "");
  if (!value.equals("")) return;
  else
    storage.putString(key, String(passkey.c_str()));
}

void Storage::resetBond() {
  const char *key = "passkey";
  storage.remove(key);
}

string Storage::getBond() {
  const char *key = "passkey";
  String value = storage.getString(key, "");
  return string(value.c_str());
}

bool Storage::hasBond() {
  const char *key = "passkey";
  String value = storage.getString(key, "");
  if (value.equals("")) return false;
  else return true;
}