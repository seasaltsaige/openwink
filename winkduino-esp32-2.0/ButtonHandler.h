#pragma once


RTC_DATA_ATTR extern int initialButton;

class ButtonHandler {

private:
  static unsigned long mainTimer;
  static unsigned long buttonTimer;
  static int buttonPressCounter;

  static void handleButtonPressesResponse(int numberOfPresses);

public:
  static void init() {
    mainTimer = 0;
    buttonTimer = 0;
    buttonPressCounter = 0;
  }

  static void setupGPIO();
  static void readOnWakeup();
  static void readWakeUpReason();

  static void loopButtonHandler();
  static void updateButtonSleep();
};