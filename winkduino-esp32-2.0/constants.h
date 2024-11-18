#ifndef _CONSTANTS_H
#define _CONSTANTS_H

#define OUT_PIN_LEFT_DOWN 4
#define OUT_PIN_LEFT_UP 5
#define OUT_PIN_RIGHT_DOWN 6
#define OUT_PIN_RIGHT_UP 7

// Using Right Headlight Up Wire
// Meaning up should be 1, down should be 0
#define UP_BUTTON_INPUT 15

#define FIRMWARE_VERSION "0.0.4"

Preferences preferences;

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;
RTC_DATA_ATTR int initialButton = -1;


#define SERVICE_UUID "a144c6b0-5e1a-4460-bb92-3674b2f51520"
#define REQUEST_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51520"
#define BUSY_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51521"


#define LEFT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51523"
#define RIGHT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51524"

#define LEFT_SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51525"
#define RIGHT_SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51527"
#define SYNC_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51526"

#define LONG_TERM_SLEEP_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51528"

#define OTA_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51529"

#define CUSTOM_BUTTON_UPDATE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51530"

#define FIRMWARE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51531"

#define SOFTWARE_UPDATING_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51532"
#define SOFTWARE_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51533"

#define HEADLIGHT_MOVEMENT_DELAY_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51534"


#define HEADLIGHT_MOVEMENT_DELAY 750

static const uint8_t primaryPhy = BLE_HCI_LE_PHY_CODED;
static const uint8_t secondaryPhy = BLE_HCI_LE_PHY_CODED;

const int customButtonPressArrayDefaults[10] = { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
const int maxTimeBetween_msDefault = 500;

#endif