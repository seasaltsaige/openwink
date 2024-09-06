#include <NimBLEDevice.h>
#include <Arduino.h>
#include "driver/rtc_io.h"
#include "driver/gpio.h"

#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif

// #ifdef ESP_PLATFORM
#include "esp_sleep.h"
// #endif

#define OUT_PIN_LEFT_DOWN 4
#define OUT_PIN_LEFT_UP 5

#define OUT_PIN_RIGHT_DOWN 6
#define OUT_PIN_RIGHT_UP 7

// Using Right Headlight Up Wire
// Meaning up should be 1, down should be 0
#define UP_BUTTON_INPUT 15

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;
RTC_DATA_ATTR int initialButton = -1;

bool buttonInterrupt();
void setAllOff();
void bothUp();
void leftUp();
void rightUp();
void bothDown();
void leftDown();
void rightDown();
void bothBlink();
void leftWink();
void rightWink();
void leftWave();
void rightWave();

#define SERVICE_UUID "a144c6b0-5e1a-4460-bb92-3674b2f51520"

#define REQUEST_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51520"

#define BUSY_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51521"

NimBLECharacteristic *busyChar = nullptr;

#define LEFT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51523"
#define RIGHT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51524"

#define LEFT_SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51525"
#define RIGHT_SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51527"
#define SYNC_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51526"

#define LONG_TERM_SLEEP_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51528"

#define HEADLIGHT_MOVEMENT_DELAY 750

NimBLECharacteristic *leftChar = nullptr;
NimBLECharacteristic *rightChar = nullptr;

static uint8_t primaryPhy = BLE_HCI_LE_PHY_CODED;
static uint8_t secondaryPhy = BLE_HCI_LE_PHY_CODED;



void updateHeadlightChars()
{
  leftChar->setValue(std::string(String(leftStatus).c_str()));
  rightChar->setValue(std::string(String(rightStatus).c_str()));
  leftChar->notify();
  rightChar->notify();
}

bool deviceConnected = false;

/* Handler class for server events */
class ServerCallbacks : public NimBLEServerCallbacks
{
  void onConnect(NimBLEServer *pServer, NimBLEConnInfo &connInfo)
  {
    deviceConnected = true;
    updateHeadlightChars();
    Serial.printf("Client connected:: %s\n", connInfo.getAddress().toString().c_str());
  };
  void onDisconnect(NimBLEServer *pServer)
  {
    deviceConnected = false;
    printf("Disconnected from client\n");
    NimBLEExtAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
    if (pAdvertising->start(0))
      printf("Started advertising\n");
    else
      printf("Failed to start advertising\n");
  };
};

class LongTermSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pChar)
  {
    printf("long term sleep written\n");
    esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);


    int buttonInp = digitalRead(UP_BUTTON_INPUT);
    if (buttonInp == 1)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 0);
    else if (buttonInp == 0)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 1);
    
    
    delay(100);
    esp_deep_sleep_start();
  }
};

class SyncCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pChar)
  {

    if (leftStatus > 1)
    {
      double valFromTop = (double)(leftStatus - 10) / 100;
      digitalWrite(OUT_PIN_LEFT_UP, HIGH);
      delay(HEADLIGHT_MOVEMENT_DELAY * valFromTop);
      digitalWrite(OUT_PIN_LEFT_UP, LOW);
    }
    else if (leftStatus == 0)
    {
      leftUp();
    }

    leftStatus = 1;
    setAllOff();
    updateHeadlightChars();

    if (rightStatus > 1)
    {
      double valFromTop = (double)(rightStatus - 10) / 100;
      digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
      delay(HEADLIGHT_MOVEMENT_DELAY * valFromTop);
      digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    }
    else if (rightStatus == 0)
    {
      rightUp();
    }

    rightStatus = 1;
    setAllOff();
    updateHeadlightChars();
  }
};

// must be in same position to work
class LeftSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pChar)
  {
    std::string value = pChar->getValue();
    int headlightValue = String(value.c_str()).toInt();
    double percentage = ((double)headlightValue) / 100;

    // Client blocks this endpoint when headlights are already sleepy

    if (leftStatus == 1)
    {
      leftDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
    }

    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    delay(percentage * HEADLIGHT_MOVEMENT_DELAY);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);

    leftStatus = headlightValue + 10;
    updateHeadlightChars();
  }
};

class RightSleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pChar)
  {
    std::string value = pChar->getValue();
    int headlightValue = String(value.c_str()).toInt();
    double percentage = ((double)headlightValue) / 100;

    // Client blocks this endpoint when headlights are already sleepy
    if (rightStatus == 1)
    {
      rightDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
    }

    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    delay(percentage * HEADLIGHT_MOVEMENT_DELAY);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);

    rightStatus = headlightValue + 10;
    updateHeadlightChars();
  }
};

class RequestCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pCharacteristic)
  {
    int tempLeft = leftStatus;
    int tempRight = rightStatus;
    std::string value = pCharacteristic->getValue();
    int valueInt = String(value.c_str()).toInt();
    busyChar->setValue("1");
    busyChar->notify();
    switch (valueInt)
    {
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
      if (tempRight == 0 || tempLeft == 0) {
        bothUp();
        delay(HEADLIGHT_MOVEMENT_DELAY);
        setAllOff();
        updateHeadlightChars();
      }
      leftWave();
      if (tempRight == 0 || tempLeft == 0) {
        delay(HEADLIGHT_MOVEMENT_DELAY);
        setAllOff();
        updateHeadlightChars();
        bothDown();
      }

      break;

    case 11:
      if (tempRight == 0 || tempLeft == 0) {
        bothUp();
        delay(HEADLIGHT_MOVEMENT_DELAY);
        setAllOff();
        updateHeadlightChars();
      }
      rightWave();
      if (tempRight == 0 || tempLeft == 0) {
        delay(HEADLIGHT_MOVEMENT_DELAY);
        setAllOff();
        updateHeadlightChars();
        bothDown();
      }
      break;
    }
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();
    updateHeadlightChars();
    busyChar->setValue("0");
    busyChar->notify();
  }
};

class advertisingCallbacks : public NimBLEExtAdvertisingCallbacks
{
  void onStopped(NimBLEExtAdvertising *pAdv, int reason, uint8_t inst_id)
  {
    switch (reason)
    {
    case 0:
      deviceConnected = true;
      printf("Client connecting\n");
      return;
    default:
      printf("Default case");
      break;
    }
  }
};



unsigned long t;


int advertiseTime_ms = 800;
int sleepTime_us = 15 * 1000 * 1000;

NimBLEExtAdvertising *pAdvertising;

void setup()
{
  Serial.begin(115200);
  // Might not be necessary since deep sleep is more or less a reboot
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

  // Outputs for headlight movement
  pinMode(OUT_PIN_LEFT_DOWN, OUTPUT);
  pinMode(OUT_PIN_LEFT_UP, OUTPUT);
  pinMode(OUT_PIN_RIGHT_DOWN, OUTPUT);
  pinMode(OUT_PIN_RIGHT_UP, OUTPUT);

  // OEM Wiring inputs to detect initial state of headlights
  pinMode(UP_BUTTON_INPUT, INPUT);
  // pinMode(DOWN_BUTTON_INPUT, INPUT);
  
  setCpuFrequencyMhz(80);

  NimBLEDevice::init("Winkduino");

  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks);

  NimBLEService *pService = pServer->createService(NimBLEUUID(SERVICE_UUID));

  NimBLECharacteristic *winkChar = pService->createCharacteristic(REQUEST_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *leftSleepChar = pService->createCharacteristic(LEFT_SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *rightSleepChar = pService->createCharacteristic(RIGHT_SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *syncChar = pService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *longTermSleepChar = pService->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE);

  syncChar->setValue(0);
  winkChar->setValue(0);

  busyChar = pService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  leftChar = pService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  rightChar = pService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);

  int wakeupValue = initialButton;
  initialButton = digitalRead(UP_BUTTON_INPUT);

  printf("Wakeup Value: %d\n", wakeupValue);
  printf("Initial Button: %d\n", initialButton);

  if (wakeupValue != -1 && (wakeupValue != initialButton)) {
    if (initialButton == 1) {
      bothUp();
    } else if (initialButton == 0) {
      bothDown();
    }
    
    rightStatus = initialButton;
    leftStatus = initialButton;

    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();
  }

  if (initialButton == LOW) {
    leftStatus = 0;
    rightStatus = 0;
  } else if (initialButton == HIGH) { 
    leftStatus = 1;
    rightStatus = 1;
  }

  updateHeadlightChars();

  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  leftSleepChar->setCallbacks(new LeftSleepCharacteristicCallbacks());
  rightSleepChar->setCallbacks(new RightSleepCharacteristicCallbacks());
  longTermSleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());

  pService->start();

  NimBLEExtAdvertisement extAdv(primaryPhy, secondaryPhy);

  extAdv.setConnectable(true);
  extAdv.setScannable(false);

  extAdv.setCompleteServices({ NimBLEUUID(SERVICE_UUID) });

  pAdvertising = NimBLEDevice::getAdvertising();

  pAdvertising->setCallbacks(new advertisingCallbacks);

  esp_sleep_enable_timer_wakeup(sleepTime_us);

  t = millis();

  if (pAdvertising->setInstanceData(0, extAdv))
  {
    if (pAdvertising->start(0))
      printf("Started advertising\n");
    else
      printf("Failed to start advertising\n");
  }
  else
    printf("Failed to register advertisment data\n");
}

bool advertising = true;

void loop()
{
  int buttonInput = digitalRead(UP_BUTTON_INPUT);
  if (buttonInput != initialButton) {
    busyChar->setValue("1");
    busyChar->notify();
    
    if (buttonInput == HIGH)
      bothUp();
    else
      bothDown();

    initialButton = buttonInput;
    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();

    updateHeadlightChars();
    busyChar->setValue("0");
    busyChar->notify();
  }

  if (!deviceConnected && (millis() - t) > advertiseTime_ms) { 
    buttonInput = digitalRead(UP_BUTTON_INPUT);
    if (buttonInput == 1)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 0);
    else if (buttonInput == 0)
      esp_sleep_enable_ext0_wakeup((gpio_num_t)UP_BUTTON_INPUT, 1);
    if (deviceConnected) return;
    printf("Deep Sleep Starting...\n");
    delay(100);
    if (!deviceConnected) {}
      esp_deep_sleep_start();
  }
}

// Both
void bothUp()
{
  if (leftStatus != 1)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  }

  if (rightStatus != 1)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  }

  leftStatus = 1;
  rightStatus = 1;
}

void bothDown()
{
  if (leftStatus != 0)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
  }

  if (rightStatus != 0)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  }

  leftStatus = 0;
  rightStatus = 0;
}

void bothBlink()
{
  if (leftStatus != 1)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  if (rightStatus != 1)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }

  updateHeadlightChars();
  delay(HEADLIGHT_MOVEMENT_DELAY);

  if (leftStatus != 1)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  if (rightStatus != 1)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  updateHeadlightChars();
}

// Left
void leftUp()
{
  if (leftStatus != 1)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
}

void leftDown()
{
  if (leftStatus != 0)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
}

void leftWink()
{

  if (leftStatus != 1)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }

  updateHeadlightChars();
  delay(HEADLIGHT_MOVEMENT_DELAY);

  if (leftStatus != 1)
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    leftStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    leftStatus = 0;
  }
  updateHeadlightChars();
}

// Right
void rightUp()
{
  if (rightStatus != 1)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
}

void rightDown()
{
  if (rightStatus != 0)
  {
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    rightStatus = 0;
  }
}

void rightWink()
{

  if (rightStatus != 1)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  updateHeadlightChars();

  delay(HEADLIGHT_MOVEMENT_DELAY);

  if (rightStatus != 1)
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
    rightStatus = 1;
  }
  else
  {
    digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);
    rightStatus = 0;
  }
  updateHeadlightChars();
}

void leftWave()
{
  // Left Down
  digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  leftStatus = 0;
  updateHeadlightChars();

  // Right down
  digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  // Turn Left Down off
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);

  // wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  rightStatus = 0;
  updateHeadlightChars();

  // Left Up
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  // Turn Right Down off
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  leftStatus = 1;
  updateHeadlightChars();

  // Right back up
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  // Left Up Off 
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  rightStatus = 1;
}

void rightWave()
{
  // Right Down
  digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  rightStatus = 0;
  updateHeadlightChars();

  // Left Down
  digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  // Turn Right Down off
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  leftStatus = 0;
  updateHeadlightChars();

  // Right Up
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  // Turn Left Down off
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  
  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);
  rightStatus = 1;
  updateHeadlightChars();

  // Left Up
  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  // Turn Right Up off
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  leftStatus = 1;
}

void setAllOff()
{
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
}
