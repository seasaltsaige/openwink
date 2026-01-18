#pragma once


extern int initialButton;
extern bool bypassHeadlightOverride;

class ButtonHandler {

private:
  static unsigned long mainTimer;
  static unsigned long buttonTimer;
  static bool resetArmed;
  static int buttonPressCounter;

  static bool isSleepyCommand;

  static bool commandRunning;

  static void handleButtonPressesResponse(int numberOfPresses);

  static void updateHeadlightDelay();

public:
  // Used for up/down actions (or blinks) --- any action which results in complete movement baseically
  static unsigned long leftTimer;
  static unsigned long rightTimer;


  static bool leftMoving;
  static bool rightMoving;

  static int leftMoveTime;
  static int rightMoveTime;

  static bool customCommandActive;
  inline static void init() {
    mainTimer = 0;
    buttonTimer = 0;
    buttonPressCounter = 0;
    customCommandActive = false;
  }

  inline static bool isBusy() {
    ButtonHandler::loopLeftMonitor();
    ButtonHandler::loopRightMonitor();
    return leftMoving || rightMoving || commandRunning;
  };

  inline static void setBusy(bool busy) {
    commandRunning = busy;
  };

  static void setupGPIO();
  static void readOnWakeup();
  static void readWakeUpReason();

  static void loopLeftMonitor();
  static void loopRightMonitor();

  static void loopButtonHandler();
  static void loopCustomCommandInterruptHandler();
  static void updateButtonSleep();
  static void setCustomCommandActive(bool value);


  inline static bool isLeftMoving() {
    return leftMoving;
  };
  inline static bool isRightMoving() {
    return rightMoving;
  };

  inline static void setIsSleepyCommand(bool sleepy) {
    isSleepyCommand = sleepy;
  }
};