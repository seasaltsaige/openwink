#include "CommandHandler.h"
#include "BLE.h"
#include "BLECallbacks.h"
#include "MainFunctions.h"

void CommandHandler::handleQueuedCommand() {
  BLE::setBusy(true);
  int command = queuedCommand;
  queuedCommand = -1;

  switch (command) {
    // Both Up
    case 1:
      bothUp();
      break;

    // Both Down
    case 2:
      bothDown();
      break;
    // Both Blink
    case 3:
      // Should function regardless of current headlight position (ie: Left is up, right is down -> Blink Command -> Left Down Left Up AND Right Up Right Down)
      bothBlink();
      break;

    // Left Up
    case 4:
      leftUp();
      break;

    // Left Down
    case 5:
      leftDown();
      break;

    // Left Blink (Wink)
    case 6:
      leftWink();
      break;

    // Right Up
    case 7:
      rightUp();
      break;

    // Right Down
    case 8:
      rightDown();
      break;

    // Right Blink (Wink)
    case 9:
      rightWink();
      break;

    // "Wave" left first
    case 10:

      if (leftStatus != rightStatus) {
        if (leftStatus == 1) rightUp();
        else rightDown();

        delay(HEADLIGHT_MOVEMENT_DELAY);

        setAllOff();
        BLE::updateHeadlightChars();
      }

      leftWave();
      break;

    case 11:

      if (leftStatus != rightStatus) {
        if (rightStatus == 1) leftUp();
        else leftDown();

        delay(HEADLIGHT_MOVEMENT_DELAY);

        setAllOff();
        BLE::updateHeadlightChars();
      }

      rightWave();

      break;
  }
  delay(HEADLIGHT_MOVEMENT_DELAY);
  setAllOff();

  BLE::updateHeadlightChars();
  BLE::setBusy(false);
}