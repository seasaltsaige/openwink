#include "handler/oem_button.h"

#include "../../include/common.h"

RTC_DATA_ATTR LEVEL OemButtonHandler::lastButtonStatus = LEVEL::LOW;
RTC_DATA_ATTR bool OemButtonHandler::customButtonEnabled = false;