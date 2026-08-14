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
bool CommandHandler::custom_command_loop = false;

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
  if (isSleepy())
    wasSleepy = true;


  queuedCommand = -1;

  switch (command) {
    // Both Up
    case 1:
      if (wasSleepy)
        sleepyReset(true, true);
      bothUp();
      break;

    // Both Down
    case 2:
      if (wasSleepy)
        sleepyReset(true, true);
      bothDown();
      break;
    // Both Blink
    case 3:
      // Should function regardless of current headlight position (ie: Left is up, right is down -> Blink Command -> Left Down Left Up AND Right Up Right Down)
      if (wasSleepy)
        sleepyReset(true, true);
      bothBlink();
      if (wasSleepy)
        sleepyEye(true, true);
      break;

    // Left Up
    case 4:
      if (wasSleepy)
        sleepyReset(true, false);
      leftUp();
      break;

    // Left Down
    case 5:
      if (wasSleepy)
        sleepyReset(true, false);
      leftDown();
      wasSleepy = false;
      break;

    // Left Blink (Wink)
    case 6:
      if (wasSleepy)
        sleepyReset(true, false);
      leftWink();
      if (wasSleepy) {
        Serial.printf("Resetting sleepy in left wink switch\n");
        sleepyEye(true, false);
      }
      break;

    // Right Up
    case 7:
      if (wasSleepy)
        sleepyReset(false, true);
      rightUp();
      break;

    // Right Down
    case 8:
      if (wasSleepy)
        sleepyReset(false, true);
      rightDown();
      break;

    // Right Blink (Wink)
    case 9:
      if (wasSleepy)
        sleepyReset(false, true);

      rightWink();

      if (wasSleepy) {
        Serial.printf("Resetting sleepy in right wink switch\n");
        sleepyEye(false, true);
      }
      break;

    // "Wave" left first
    case 10:
      if (wasSleepy)
        sleepyReset(true, true);

      if (leftStatus != rightStatus) {
        if (leftStatus == 1) rightUp();
        else rightDown();
        setAllOff();
        BLE::updateHeadlightChars();
      }
      waveHeadlights(WAVE_START_SIDE::LEFT);

      if (wasSleepy)
        sleepyEye(true, true);
      break;

    // "Wave" right first
    case 11:
      if (wasSleepy)
        sleepyReset(true, true);

      if (leftStatus != rightStatus) {
        if (rightStatus == 1) leftUp();
        else leftDown();
        setAllOff();
        BLE::updateHeadlightChars();
      }
      waveHeadlights(WAVE_START_SIDE::RIGHT);

      if (wasSleepy)
        sleepyEye(true, true);
      break;

    // left - right sequence
    case 12:

      if (wasSleepy)
        sleepyReset(true, true);

      if (leftStatus == 0) rightDown();
      else rightUp();

      if (leftStatus == 0) {
        leftUp();
        bothSwap();
        bothSwap();
        leftDown();
      } else {
        leftDown();
        bothSwap();
        bothSwap();
        leftUp();
      }

      if (wasSleepy)
        sleepyEye(true, true);
      break;
    // left - right x2
    case 13:

      if (wasSleepy)
        sleepyReset(true, true);

      if (leftStatus == 0) rightDown();
      else rightUp();

      if (leftStatus == 0) {
        leftUp();
        bothSwap();
        bothSwap();
      } else {
        leftDown();
        bothSwap();
        bothSwap();
      }

      bothSwap();
      bothSwap();

      if (leftStatus == 0) {
        leftUp();
      } else {
        leftDown();
      }

      if (wasSleepy)
        sleepyEye(true, true);
      break;
    // right - left
    case 14:

      if (wasSleepy)
        sleepyReset(true, true);

      if (rightStatus == 0) leftDown();
      else leftUp();

      if (rightStatus == 0) {
        rightUp();
        bothSwap();
        bothSwap();
        rightDown();
      } else {
        rightDown();
        bothSwap();
        bothSwap();
        rightUp();
      }

      if (wasSleepy)
        sleepyEye(true, true);
      break;
    // right - left x2
    case 15:

      if (wasSleepy)
        sleepyReset(true, true);

      if (rightStatus == 0) leftDown();
      else leftUp();

      if (rightStatus == 0) {
        rightUp();
        bothSwap();
        bothSwap();
      } else {
        rightDown();
        bothSwap();
        bothSwap();
      }

      bothSwap();
      bothSwap();

      
      if (rightStatus == 0) {
        rightUp();
      } else {
        rightDown();
      }

      if (wasSleepy)
        sleepyEye(true, true);

      break;
  }

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
  for (int i = 0; i < commandSequence.size(); i++) {
    auto cmd = commandSequence[i];

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
          waveHeadlights(WAVE_START_SIDE::LEFT);
          break;

        case 11:

          if (leftStatus != rightStatus) {
            if (rightStatus == 1) leftUp();
            else leftDown();
            setAllOff();
            BLE::updateHeadlightChars();
          }
          waveHeadlights(WAVE_START_SIDE::RIGHT);
          break;

        // left - right sequence
        case 12:

          if (leftStatus == 0) rightDown();
          else rightUp();

          if (leftStatus == 0) {
            leftUp();
            bothSwap();
            bothSwap();
            leftDown();
          } else {
            leftDown();
            bothSwap();
            bothSwap();
            leftUp();
          }

          break;
        // left - right x2
        case 13:
          if (leftStatus == 0) rightDown();
          else rightUp();

          if (leftStatus == 0) {
            leftUp();
            bothSwap();
            bothSwap();
          } else {
            leftDown();
            bothSwap();
            bothSwap();
          }

          bothSwap();
          bothSwap();

          if (leftStatus == 0) {
            leftUp();
          } else {
            leftDown();
          }
          break;
        // right - left
        case 14:
          if (rightStatus == 0) leftDown();
          else leftUp();

          if (rightStatus == 0) {
            rightUp();
            bothSwap();
            bothSwap();
            rightDown();
          } else {
            rightDown();
            bothSwap();
            bothSwap();
            rightUp();
          }
          break;
        // right - left x2
        case 15:
          if (rightStatus == 0) leftDown();
          else leftUp();

          if (rightStatus == 0) {
            rightUp();
            bothSwap();
            bothSwap();
          } else {
            rightDown();
            bothSwap();
            bothSwap();
          }

          bothSwap();
          bothSwap();

          
          if (rightStatus == 0) {
            rightUp();
          } else {
            rightDown();
          }
          break;
      }

      setAllOff();
    }
    ButtonHandler::loopButtonHandler();

    if (i == (commandSequence.size() - 1) && CommandHandler::custom_command_loop) i = -1;
  }

  if (wasSleepy)
    sleepyEye(true, true);

  ButtonHandler::setCustomCommandActive(false);
  BLE::setCustomStatus(0);
  BLE::setBusy(false);
  commandSequence.clear();
}
