#include <Arduino.h>

#include "MainFunctions.h"
#include "ButtonHandler.h"
#include "constants.h"
#include "BLE.h"
#include "BLECallbacks.h"

bool isSleepy() {
  if ((leftStatus != 0 && leftStatus != 1) || (rightStatus != 0 && rightStatus != 1))
    return true;
  else return false;
}

void sleepyEye(bool leftSet, bool rightSet) {
  if (!leftSet && !rightSet) return;
  if (isSleepy()) return;

  BLE::setBusy(true);

  // Used to ignore for timing
  ButtonHandler::setIsSleepyCommand(true);

  double left = leftSleepyValue / 100;
  double right = rightSleepyValue / 100;

  if (leftStatus == 1 || rightStatus == 1) {
    bothDown();
    setAllOff();
  }

  unsigned long initialTime = millis();
  if (leftSet)
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  if (rightSet)
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

  bool leftStatusReached = false;
  bool rightStatusReached = false;

  // Delay loop for both headlights
  while ((leftSet && !leftStatusReached) || (rightSet && !rightStatusReached)) {
    unsigned long timeElapsed = (millis() - initialTime);
    if (leftSet && !leftStatusReached && timeElapsed >= (left * ButtonHandler::leftMoveTime)) {
      leftStatusReached = true;
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
    }
    if (rightSet && !rightStatusReached && timeElapsed >= (right * ButtonHandler::leftMoveTime)) {
      rightStatusReached = true;
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    }
  }

  setAllOff();

  if (leftSet)
    leftStatus = leftSleepyValue + 10;
  if (rightSet)
    rightStatus = rightSleepyValue + 10;

  ButtonHandler::setIsSleepyCommand(false);
  BLE::updateHeadlightChars();
  BLE::setBusy(false);
}

void sleepyReset(bool leftSet, bool rightSet) {
  if (!leftSet && !rightSet) return;
  if (!isSleepy()) return;

  ButtonHandler::setIsSleepyCommand(true);
  BLE::setBusy(true);

  double percentageToUpLeft = 1 - (leftSleepyValue / 100);
  double percentageToUpRight = 1 - (rightSleepyValue / 100);
  unsigned long initialTime = millis();

  if (leftSet) {
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    ButtonHandler::leftMoving = true;
    ButtonHandler::leftTimer = millis();
  }
  if (rightSet) {
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    ButtonHandler::rightMoving = true;
    ButtonHandler::rightTimer = millis();
  }

  bool leftStatusReached = false;
  bool rightStatusReached = false;

  while ((leftSet && !leftStatusReached) || (leftSet && !rightStatusReached)) {
    unsigned long timeElapsed = (millis() - initialTime);
    if (!ButtonHandler::isLeftMoving()) {
      leftStatusReached = true;
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
    }
    if (!ButtonHandler::isRightMoving()) {
      rightStatusReached = true;
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    }
  }

  setAllOff();

  if (leftSet)
    leftStatus = 1;
  if (rightSet)
    rightStatus = 1;

  ButtonHandler::setIsSleepyCommand(false);
  BLE::updateHeadlightChars();
  BLE::setBusy(false);
}

// Both
void bothUp() {
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  }

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  }

  leftStatus = 1;
  rightStatus = 1;
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void bothDown() {

  if (leftStatus != 0) {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
  }

  if (rightStatus != 0) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  }
  leftStatus = 0;
  rightStatus = 0;

  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void bothBlink() {

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }

  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

// Left
void leftUp() {
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void leftDown() {
  if (leftStatus != 0) {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void leftWink() {


  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

// Right
void rightUp() {
  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void rightDown() {
  if (rightStatus != 0) {
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    rightStatus = 0;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void rightWink() {

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }

  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();

  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  BLE::updateHeadlightChars();
}

void leftWave() {
  double headlightToEndMultiplier = 1.0 - headlightMultiplier;

  Serial.printf("Left wave: %f, %f\n", headlightMultiplier, headlightToEndMultiplier);

  // Down case
  if (leftStatus == 0 && rightStatus == 0) {

    // Start left up
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);

    // Wait percentage of delay
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    // Start right up
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

    // Wait rest of delay, left is now fully up, right is partially up
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    leftStatus = 1;
    BLE::updateHeadlightChars();

    // Start left down
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);

    // Wait partial delay, right is now fully up, left is partially down
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    rightStatus = 1;
    BLE::updateHeadlightChars();

    // Start right down
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);

    // Wait rest of delay, left is fully down, turn off left, right is partially down
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    leftStatus = 0;
    BLE::updateHeadlightChars();

    // Left Off
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

    // Both fully down now
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    rightStatus = 0;
    BLE::updateHeadlightChars();

    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

    // Up case
  } else {

    // Start left down
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);

    // Wait percentage of delay
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    // Start right down
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);

    // Wait rest of delay, left is now fully down, right is partially down
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    leftStatus = 0;
    BLE::updateHeadlightChars();

    // Start left up
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

    // Wait partial delay, right is now fully down, left is partially up
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    rightStatus = 0;
    BLE::updateHeadlightChars();

    // Start right up
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

    // Wait rest of delay, left is fully up, turn off left, right is partially up
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    leftStatus = 1;
    BLE::updateHeadlightChars();

    // Left Off
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

    // Both fully up now
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    rightStatus = 1;
    BLE::updateHeadlightChars();

    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  }
}

void rightWave() {
  double headlightToEndMultiplier = 1.0 - headlightMultiplier;

  Serial.printf("Right wave: %f, %f\n", headlightMultiplier, headlightToEndMultiplier);

  // Down case
  if (leftStatus == 0 && rightStatus == 0) {

    // Start right up
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

    // Wait percentage of delay
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    // Start left up
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);

    // Wait rest of delay, right is now fully up, left is partially up
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    rightStatus = 1;
    BLE::updateHeadlightChars();

    // Start right down
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);

    // Wait partial delay, left is now fully up, right is partially down
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    leftStatus = 1;
    BLE::updateHeadlightChars();

    // Start left down
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);

    // Wait rest of delay, right is fully down, turn off right, left is partially down
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    rightStatus = 0;
    BLE::updateHeadlightChars();

    // Right Off
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

    // Both fully down now
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    leftStatus = 0;
    BLE::updateHeadlightChars();

    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

    // Up case
  } else {

    // Start right down
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);

    // Wait percentage of delay
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    // Start left down
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);

    // Wait rest of delay, right is now fully down, left is partially down
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    rightStatus = 0;
    BLE::updateHeadlightChars();

    // Start right up
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

    // Wait partial delay, left is now fully down, right is partially up
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    leftStatus = 0;
    BLE::updateHeadlightChars();

    // Start left up
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

    // Wait rest of delay, right is fully up, turn off right, left is partially up
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightToEndMultiplier);

    rightStatus = 1;
    BLE::updateHeadlightChars();

    // Right Off
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

    // Both fully up now
    delay(HEADLIGHT_MOVEMENT_DELAY * headlightMultiplier);

    leftStatus = 1;
    BLE::updateHeadlightChars();

    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  }
}

void setAllOff() {
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
}