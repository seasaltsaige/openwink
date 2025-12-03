#include "constants.h"

#include <string>

#include "esp_attr.h"

const std::string customButtonPressArrayDefaults[9] = { "1", "0", "0", "0", "0",
                                                        "0", "0", "0", "0" };
const int maxTimeBetween_msDefault = 500;
const int sleepTime_us = 15 * 1000 * 1000;
const int advertiseTime_ms = 750;
int awakeTime_ms = 0;
RTC_DATA_ATTR int HEADLIGHT_MOVEMENT_DELAY = 580;
RTC_DATA_ATTR double leftSleepyValue = 50;
RTC_DATA_ATTR double rightSleepyValue = 50;