#include <Arduino.h>

#include "MainFunctions.h"
#include "constants.h"
#include "BLE.h"
#include "BLECallbacks.h"

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
}

void bothBlink() {

  // TODO: Can most likely be refactored to be more concise.
  if (leftStatus > 1 || rightStatus > 1) {
    // if headlights are in sleepy eye position, calculate delays to return
    double leftToSleepy = leftSleepyValue / 100;
    double rightToSleepy = rightSleepyValue / 100;
    double leftToUp = (1 - leftToSleepy);
    double rightToUp = (1 - rightToSleepy);


    // headlights have already moved partway up, so continue this

    bothUp();

    unsigned long initialTime = millis();
    bool leftStatusReached = false;
    bool rightStatusReached = false;
    while (!leftStatusReached || !rightStatusReached) {
      unsigned long timeElapsed = (millis() - initialTime);
      if (!leftStatusReached && timeElapsed >= (leftToUp * HEADLIGHT_MOVEMENT_DELAY)) {
        leftStatusReached = true;
        digitalWrite(OUT_PIN_LEFT_UP, LOW);
      }
      if (!rightStatusReached && timeElapsed >= (rightToUp * HEADLIGHT_MOVEMENT_DELAY)) {
        rightStatusReached = true;
        digitalWrite(OUT_PIN_RIGHT_UP, LOW);
      }
    }


    setAllOff();
    // Headlights up at this point

    bothDown();
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();

    bothUp();

    // Return to sleepy
    initialTime = millis();
    leftStatusReached = false;
    rightStatusReached = false;
    while (!leftStatusReached || !rightStatusReached) {
      unsigned long timeElapsed = (millis() - initialTime);
      if (!leftStatusReached && timeElapsed >= (leftToSleepy * HEADLIGHT_MOVEMENT_DELAY)) {
        leftStatusReached = true;
        digitalWrite(OUT_PIN_LEFT_UP, LOW);
      }
      if (!rightStatusReached && timeElapsed >= (rightToSleepy * HEADLIGHT_MOVEMENT_DELAY)) {
        rightStatusReached = true;
        digitalWrite(OUT_PIN_RIGHT_UP, LOW);
      }
    }

    setAllOff();

    leftStatus = leftSleepyValue + 10;
    rightStatus = rightSleepyValue + 10;

    BLE::updateHeadlightChars();

  } else {

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
  }
  // BLE::updateHeadlightChars();
}

// Left
void leftUp() {
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
}

void leftDown() {
  if (leftStatus != 0) {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
}

void leftWink() {

  if (leftStatus > 1) {
    // if headlights are in sleepy eye position, calculate delays to return
    double leftToSleepy = leftSleepyValue / 100;
    double leftToUp = (1 - leftToSleepy);


    // headlights have already moved partway up, so continue this

    leftUp();

    unsigned long initialTime = millis();
    bool leftStatusReached = false;
    while (!leftStatusReached) {
      unsigned long timeElapsed = (millis() - initialTime);
      if (!leftStatusReached && timeElapsed >= (leftToUp * HEADLIGHT_MOVEMENT_DELAY)) {
        leftStatusReached = true;
        digitalWrite(OUT_PIN_LEFT_UP, LOW);
      }
    }

    setAllOff();
    // Headlights up at this point

    leftDown();
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();

    leftUp();

    // Return to sleepy
    initialTime = millis();
    leftStatusReached = false;
    while (!leftStatusReached) {
      unsigned long timeElapsed = (millis() - initialTime);
      if (!leftStatusReached && timeElapsed >= (leftToSleepy * HEADLIGHT_MOVEMENT_DELAY)) {
        leftStatusReached = true;
        digitalWrite(OUT_PIN_LEFT_UP, LOW);
      }
    }

    setAllOff();
    leftStatus = leftSleepyValue + 10;
    BLE::updateHeadlightChars();
  } else {

    if (leftStatus != 1) {
      digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
      digitalWrite(OUT_PIN_LEFT_UP, HIGH);
      leftStatus = 1;
    } else {
      digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
      leftStatus = 0;
    }

    BLE::updateHeadlightChars();
    delay(HEADLIGHT_MOVEMENT_DELAY);

    if (leftStatus != 1) {
      digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
      digitalWrite(OUT_PIN_LEFT_UP, HIGH);
      leftStatus = 1;
    } else {
      digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
      leftStatus = 0;
    }
    BLE::updateHeadlightChars();
  }
}

// Right
void rightUp() {
  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
}

void rightDown() {
  if (rightStatus != 0) {
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    rightStatus = 0;
  }
}

void rightWink() {
  if (rightStatus > 1) {
    // if headlights are in sleepy eye position, calculate delays to return
    double rightToSleepy = rightSleepyValue / 100;
    double rightToUp = (1 - rightToSleepy);

    // headlights have already moved partway up, so continue this
    rightUp();

    unsigned long initialTime = millis();
    bool rightStatusReached = false;
    while (!rightStatusReached) {
      unsigned long timeElapsed = (millis() - initialTime);
      if (!rightStatusReached && timeElapsed >= (rightToUp * HEADLIGHT_MOVEMENT_DELAY)) {
        rightStatusReached = true;
        digitalWrite(OUT_PIN_RIGHT_UP, LOW);
      }
    }

    setAllOff();
    rightStatus = 1;
    BLE::updateHeadlightChars();
    // Headlights up at this point

    rightDown();
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();

    rightStatus = 0;
    BLE::updateHeadlightChars();

    rightUp();

    // Return to sleepy
    initialTime = millis();
    rightStatusReached = false;
    while (!rightStatusReached) {
      unsigned long timeElapsed = (millis() - initialTime);
      if (!rightStatusReached && timeElapsed >= (rightToSleepy * HEADLIGHT_MOVEMENT_DELAY)) {
        rightStatusReached = true;
        digitalWrite(OUT_PIN_RIGHT_UP, LOW);
      }
    }
    setAllOff();
    rightStatus = rightSleepyValue + 10;
    BLE::updateHeadlightChars();

  } else {
    if (rightStatus != 1) {
      digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
      digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
      rightStatus = 1;
    } else {
      digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
      rightStatus = 0;
    }
    BLE::updateHeadlightChars();

    delay(HEADLIGHT_MOVEMENT_DELAY);

    if (rightStatus != 1) {
      digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
      digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
      rightStatus = 1;
    } else {
      digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
      rightStatus = 0;
    }
    BLE::updateHeadlightChars();
  }
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