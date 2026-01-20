#include <Arduino.h>

#include "MainFunctions.h"
#include "ButtonHandler.h"
#include "constants.h"
#include "Storage.h"
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
  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::rightMoving = true;
  ButtonHandler::leftTimer = millis();
  ButtonHandler::rightTimer = millis();
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

  while (ButtonHandler::isBusy()) {};
  BLE::updateHeadlightChars();
}

void bothDown() {
  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::rightMoving = true;
  ButtonHandler::leftTimer = millis();
  ButtonHandler::rightTimer = millis();

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

  while (ButtonHandler::isBusy()) {};
  BLE::updateHeadlightChars();
}

void bothBlink() {
  ButtonHandler::setBusy(true);

  ButtonHandler::leftMoving = true;
  ButtonHandler::rightMoving = true;
  ButtonHandler::leftTimer = millis();
  ButtonHandler::rightTimer = millis();

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


  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();


  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::rightMoving = true;
  ButtonHandler::leftTimer = millis();
  ButtonHandler::rightTimer = millis();
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

  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}

// Left
void leftUp() {
  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::leftTimer = millis();
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}

void leftDown() {
  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::leftTimer = millis();
  if (leftStatus != 0) {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}

void leftWink() {
  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::leftTimer = millis();

  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();


  ButtonHandler::setBusy(true);
  ButtonHandler::leftMoving = true;
  ButtonHandler::leftTimer = millis();
  if (leftStatus != 1) {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  } else {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}

// Right
void rightUp() {
  ButtonHandler::setBusy(true);
  ButtonHandler::rightMoving = true;
  ButtonHandler::rightTimer = millis();
  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}

void rightDown() {
  ButtonHandler::setBusy(true);
  ButtonHandler::rightMoving = true;
  ButtonHandler::rightTimer = millis();
  if (rightStatus != 0) {
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    rightStatus = 0;
  }
  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}

void rightWink() {
  ButtonHandler::setBusy(true);
  ButtonHandler::rightMoving = true;
  ButtonHandler::rightTimer = millis();
  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }

  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();

  ButtonHandler::setBusy(true);
  ButtonHandler::rightMoving = true;
  ButtonHandler::rightTimer = millis();
  if (rightStatus != 1) {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  } else {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  while (ButtonHandler::isBusy()) {}
  BLE::updateHeadlightChars();
}


enum WaveState {
  START_SIDE,
  START_OPP,
  RETURN_SIDE,
  RETURN_OPP,
  DONE_SIDE,
  DONE_OPP,
  FINISH,
};
WaveState waveState = START_SIDE;

void waveSetStatus(WAVE_START_SIDE side, int value) {
  if (side == WAVE_START_SIDE::LEFT) leftStatus = value;
  else rightStatus = value;
}

bool isMoving(WAVE_START_SIDE side) {
  return side == WAVE_START_SIDE::LEFT ? ButtonHandler::isLeftMoving() : ButtonHandler::isRightMoving();
}

void startMovement(WAVE_START_SIDE side) {
  if (side == WAVE_START_SIDE::LEFT) {
    ButtonHandler::leftMoving = true;
    ButtonHandler::leftTimer = millis();
  } else {
    ButtonHandler::rightMoving = true;
    ButtonHandler::rightTimer = millis();
  }
}

void waveHeadlights(WAVE_START_SIDE side) {
  bool orien = Storage::getHeadlightOrientation();
  double leftHeadlightDelay = static_cast<double>(!orien ? ButtonHandler::leftMoveTime : ButtonHandler::rightMoveTime);
  double rightHeadlightDelay = static_cast<double>(!orien ? ButtonHandler::rightMoveTime : ButtonHandler::leftMoveTime);

  // arbitrary choice, chose to check against starting on the left.
  // true if left start side, false if right start side
  const bool SIDE_CHECK = side == WAVE_START_SIDE::LEFT;

  // values for START and OPPOSITE sides. (based on SIDE_CHECK)
  WAVE_START_SIDE STRT_SIDE = SIDE_CHECK ? WAVE_START_SIDE::LEFT : WAVE_START_SIDE::RIGHT;
  WAVE_START_SIDE OPP_SIDE = SIDE_CHECK ? WAVE_START_SIDE::RIGHT : WAVE_START_SIDE::LEFT;

  // Delay used to start OPP_SIDE headlight
  double delay = SIDE_CHECK ? leftHeadlightDelay : rightHeadlightDelay;
  // Boolean to check if starting in down or up position
  bool startPosDown = leftStatus == 0 && rightStatus == 0;

  // Timer variable used for delay based actuation of opposite headlight
  unsigned long waveTimer = 0;

  // if true, up should be high
  const int dir = startPosDown ? HIGH : LOW;

  // PINS to send high/low based on SIDE_CHECK
  // Start Side pins
  const int SIDE_DOWN = SIDE_CHECK ? OUT_PIN_LEFT_DOWN : OUT_PIN_RIGHT_DOWN;
  const int SIDE_UP = SIDE_CHECK ? OUT_PIN_LEFT_UP : OUT_PIN_RIGHT_UP;

  // Opposite Side pins
  const int OPP_DOWN = SIDE_CHECK ? OUT_PIN_RIGHT_DOWN : OUT_PIN_LEFT_DOWN;
  const int OPP_UP = SIDE_CHECK ? OUT_PIN_RIGHT_UP : OUT_PIN_LEFT_UP;

  while (waveState != FINISH) {
    switch (waveState) {
      case START_SIDE:
        // Start the starting side in the movement direction (if starting low, UP, if starting high, DOWN)
        digitalWrite(SIDE_DOWN, !dir);
        digitalWrite(SIDE_UP, dir);
        // begin handler movement
        startMovement(STRT_SIDE);
        // Start timer for percentage based wave
        waveTimer = millis();
        // continue to next step
        waveState = START_OPP;
        break;

      case START_OPP:
        //
        if ((millis() - waveTimer) >= (delay * headlightMultiplier)) {
          digitalWrite(OPP_DOWN, !dir);
          digitalWrite(OPP_UP, dir);

          waveSetStatus(STRT_SIDE, (dir ? (headlightMultiplier * 100) : ((1.0 - headlightMultiplier) * 100) + 10));
          startMovement(OPP_SIDE);

          BLE::updateHeadlightChars();

          waveState = RETURN_SIDE;
          waveTimer = 0;
        }
        break;

      case RETURN_SIDE:
        // Once left stops moving, send back up
        if (!isMoving(STRT_SIDE)) {
          digitalWrite(SIDE_DOWN, dir);
          digitalWrite(SIDE_UP, !dir);

          waveSetStatus(STRT_SIDE, dir);
          startMovement(STRT_SIDE);

          BLE::updateHeadlightChars();
          waveState = RETURN_OPP;
        }
        break;

      case RETURN_OPP:
        // Once right stops moving, send it back down
        if (!isMoving(OPP_SIDE)) {
          digitalWrite(OPP_DOWN, dir);
          digitalWrite(OPP_UP, !dir);

          waveSetStatus(OPP_SIDE, dir);
          startMovement(OPP_SIDE);

          BLE::updateHeadlightChars();
          waveState = DONE_SIDE;
        }
        break;

      case DONE_SIDE:
        // Wait for left to finish moving, and turn it off
        if (!isMoving(STRT_SIDE)) {
          digitalWrite(SIDE_DOWN, LOW);
          digitalWrite(SIDE_UP, LOW);

          waveSetStatus(STRT_SIDE, !dir);

          waveState = DONE_OPP;
          BLE::updateHeadlightChars();
        }
        break;

      case DONE_OPP:
        // Wait for right to finish moving, and turn it off
        if (!isMoving(OPP_SIDE)) {
          digitalWrite(OPP_DOWN, LOW);
          digitalWrite(OPP_UP, LOW);

          waveSetStatus(OPP_SIDE, !dir);

          waveState = FINISH;
          BLE::updateHeadlightChars();
        }
        break;
    }
  }

  // Reset wave state to get ready for next wave
  waveState = START_SIDE;
  // Disable all pins to ensure all are off
  setAllOff();
}

void setAllOff() {
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
}