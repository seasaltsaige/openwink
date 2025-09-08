#pragma once


extern int initialButton;

class ButtonHandler {

private:
  static unsigned long mainTimer;
  static unsigned long buttonTimer;
  static unsigned long resetTimer;
  static bool resetArmed;
  static int resetPressCounter;
  static int buttonPressCounter;
  static bool customCommandActive;

  static void handleButtonPressesResponse(int numberOfPresses);

public:
  static void init() {
    mainTimer = 0;
    buttonTimer = 0;
    buttonPressCounter = 0;
    customCommandActive = false;
  }

  static void setupGPIO();
  static void readOnWakeup();
  static void readWakeUpReason();

  static void loopButtonHandler();
  static void loopCustomCommandInterruptHandler();
  static void handleBusyInput();
  static void updateButtonSleep();
  static void setCustomCommandActive(bool value);
  static void handleResetLogic();
};