#pragma once

#include "esp_sleep.h"

#define OUT_PIN_LEFT_DOWN 10
#define OUT_PIN_LEFT_UP 11
#define OUT_PIN_RIGHT_DOWN 12
#define OUT_PIN_RIGHT_UP 13

// Using Right Headlight Up Wire
// Meaning up should be 1, down should be 0
#define OEM_BUTTON_INPUT 9

// Green wire in wiring harness, indicating busy when high
#define OEM_HEADLIGHT_STATUS 47 // UPDATE TO 46 FOR PROD

#define FIRMWARE_VERSION "0.3.0"

/** ---- BEGIN BLE UUID DEFINITIONS ---- **/
// Service for headlight movements
#define WINK_SERVICE_UUID "a144c6b0-5e1a-4460-bb92-3674b2f51520"
// Service for OTA Update + OTA Status indication
#define OTA_SERVICE_UUID "e24c13d7-d7c7-4301-903a-7750b09fc935"
// Service for Wink Module Settings
#define MODULE_SETTINGS_SERVICE_UUID "cb5f7a1f-59f2-418e-b9d1-d6fc5c85a749"

// WINK CHARACTERISTICS //
#define HEADLIGHT_CHAR_UUID "034a383c-d3e4-4501-b7a5-1c950db4f3c7"
#define BUSY_CHAR_UUID "8d2b7b9f-c6a3-4f56-9f4f-2dc7d7873c18"
#define LEFT_STATUS_UUID "c4907f4a-fb0c-440c-bbf1-4836b0636478"
#define RIGHT_STATUS_UUID "784dd553-d837-4027-9143-280cb035163a"
#define LEFT_SLEEPY_EYE_UUID "a8237fed-e0a4-4ecd-9881-9b5dbb3f5902"
#define RIGHT_SLEEPY_EYE_UUID "bf133860-e47e-43e3-b1ed-cd87a1d9cb63"
#define SYNC_UUID "eceed349-998f-46a2-9835-4f2db7552381"
// END WINK CHARACTERISTICS

// OTA CHARACTERISTICS //
#define OTA_UUID "58f93211-63c5-4b0b-b4e6-544c559417d7"
#define FIRMWARE_UUID "37187af3-defd-46df-a8de-881c0b20d8b3"
#define SOFTWARE_UPDATING_CHAR_UUID "a0ee1ea6-2b18-4ae6-aa87-0238dde7d760"
#define SOFTWARE_STATUS_CHAR_UUID "2d393ed3-ed78-4d57-900a-d3e46296f92d"
// END OTA CHARACTERISTICS //

// SETTINGS CHARACTERISTICS //
#define LONG_TERM_SLEEP_UUID "0104b643-56b0-4dd8-85c7-6bd00f9c732e"
#define CUSTOM_BUTTON_UPDATE_UUID "795a9433-cf23-4550-80b5-70a0c9413cac"
#define HEADLIGHT_MOVEMENT_DELAY_UUID "859290b7-32f5-4afd-80fd-832b95bc5a4b"
#define HEADLIGHT_MOTION_IN_UUID "5cdfa4ac-31f5-439b-af8d-ec09a808ce9d"
// END SETTINGS CHARACTERISTICS //

/** ---- END BLE UUID DEFINITIONS ---- **/



extern const int customButtonPressArrayDefaults[10];
extern const int maxTimeBetween_msDefault;
extern const int sleepTime_us;
extern const int advertiseTime_ms;
extern int awakeTime_ms;
extern int HEADLIGHT_MOVEMENT_DELAY;