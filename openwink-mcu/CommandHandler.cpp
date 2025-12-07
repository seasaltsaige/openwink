#include <string>
#include "CommandHandler.h"
#include "BLE.h"
#include "BLECallbacks.h"
#include "MainFunctions.h"
#include "ButtonHandler.h"

#include <stdio.h>
#include <string.h>
#include <vector>

using namespace std;

vector<string> CommandHandler::commandSequence;

void CommandHandler::parseCustomCommand(string command) {
  char* command_c_str = const_cast<char*>(command.c_str());
  char* token = strtok(command_c_str, "-");
  while (token != NULL) {
    commandSequence.push_back(string(token));
    token = strtok(NULL, "-");
  }

  for (string part : commandSequence) {
    Serial.printf("Command part: %s\n", part.c_str());
  }
}

void CommandHandler::handleQueuedCommand() {
  BLE::setBusy(true);
  int command = queuedCommand;

  bool wasSleepy = false;
  if (isSleepy()) {
    if (command != 1 && command != 2)
      wasSleepy = true;
    sleepyReset(true, true);
  }


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
        setAllOff();
        BLE::updateHeadlightChars();
      }

      leftWave();
      break;

    case 11:

      if (leftStatus != rightStatus) {
        if (rightStatus == 1) leftUp();
        else leftDown();
        setAllOff();
        BLE::updateHeadlightChars();
      }

      rightWave();

      break;
  }

  if (wasSleepy)
    sleepyEye(true, true);

  setAllOff();
  BLE::setBusy(false);
}

void CommandHandler::handleQueuedCustomCommand() {
  parseCustomCommand(queuedCustomCommand);
  queuedCustomCommand = "";
  ButtonHandler::setCustomCommandActive(true);

  bool wasSleepy = false;
  if (isSleepy()) {
    wasSleepy = true;
    sleepyReset(true, true);
  }

  BLE::setBusy(true);
  for (auto cmd : commandSequence) {
    if (!ButtonHandler::customCommandActive) break;

    if (cmd[0] == 'd') {
      string portion = cmd.substr(1);
      int time = stoi(portion);
      delay(time);
    } else {
      int parsedCommand = stoi(cmd);
      Serial.printf("Command: %d\n", parsedCommand);
      switch (parsedCommand) {
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
            setAllOff();
            BLE::updateHeadlightChars();
          }

          leftWave();
          break;

        case 11:

          if (leftStatus != rightStatus) {
            if (rightStatus == 1) leftUp();
            else leftDown();
            setAllOff();
            BLE::updateHeadlightChars();
          }

          rightWave();

          break;
      }

      setAllOff();
    }
    ButtonHandler::loopButtonHandler();
  }

  if (wasSleepy)
    sleepyEye(true, true);

  ButtonHandler::setCustomCommandActive(false);
  BLE::setCustomStatus(0);
  BLE::setBusy(false);
  commandSequence.clear();
}
