#include "constants.h"

#include <string>

#include "esp_attr.h"

const std::string customButtonPressArrayDefaults[20] = { "1", "0", "0", "0", "0", "0", "0", "0", "0",  
                                                                // swap                                 
                                                        "0", "0", "12", "0", "0", "0", "0", "0", "0", "0", "20"};
const int maxTimeBetween_msDefault = 500;
const int sleepTime_us = 15 * 1000 * 1000;
const int advertiseTime_ms = 750;
int awakeTime_ms = 0;
RTC_DATA_ATTR int HEADLIGHT_MOVEMENT_DELAY = 625;
RTC_DATA_ATTR double leftSleepyValue = 50;
RTC_DATA_ATTR double rightSleepyValue = 50;

int OUT_PIN_LEFT_DOWN = 10;
int OUT_PIN_LEFT_UP = 11;
int OUT_PIN_RIGHT_DOWN = 12;
int OUT_PIN_RIGHT_UP = 13;

int OEM_HEADLIGHT_STATUS_RIGHT = 46;
int OEM_HEADLIGHT_STATUS_LEFT = 3;