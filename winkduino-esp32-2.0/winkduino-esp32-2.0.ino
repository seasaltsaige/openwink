#include <NimBLEDevice.h>
#include <Arduino.h>
#include "driver/rtc_io.h"
#include "driver/gpio.h"

#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif

#ifdef ESP_PLATFORM
#include "esp_sleep.h"
#endif

#define OUT_PIN_LEFT_DOWN 4
#define OUT_PIN_LEFT_UP 5
#define OUT_PIN_RIGHT_DOWN 6
#define OUT_PIN_RIGHT_UP 7

#define LEFT_DOWN_INPUT 15
#define LEFT_UP_INPUT 16

#define RIGHT_DOWN_INPUT 17
#define RIGHT_UP_INPUT 18

#define GPIO_WAKEUP 1

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;

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

    gpio_pullup_en((gpio_num_t)LEFT_DOWN_INPUT);
    gpio_pullup_en((gpio_num_t)RIGHT_DOWN_INPUT);

    int leftDownRead = digitalRead(LEFT_DOWN_INPUT);
    int rightDownRead = digitalRead(RIGHT_DOWN_INPUT);

    if (leftDownRead == LOW && rightDownRead == LOW) {
      printf("Down position\n");
      esp_sleep_enable_ext0_wakeup((gpio_num_t)LEFT_DOWN_INPUT, 1);
    } else {
      printf("Up position\n");
      esp_sleep_enable_ext0_wakeup((gpio_num_t)LEFT_UP_INPUT, 1);
    }
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
    std::string value = pCharacteristic->getValue();
    int valueInt = String(value.c_str()).toInt();
    Serial.printf("%d", valueInt);
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
      leftWave();
      break;

    case 11:
      //   // "Wave" right first
      rightWave();
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
    case BLE_HS_ETIMEOUT:
      // printf("Time expired - sleeping for %" PRIu32 "seconds\n", sleepSeconds);
      break;
    default:
      printf("Default case");
      break;
    }
  }
};


int initialReadLeftDown = -1;
int initialReadLeftUp = -1;
int initialReadRightDown = -1;
int initialReadRightUp = -1;

unsigned long t;


int advertiseTime_ms = 650;
int sleepTime_us = 11 * 1000 * 1000;

void setup()
{
  Serial.begin(115200);

  // Outputs for headlight movement
  pinMode(OUT_PIN_LEFT_DOWN, OUTPUT);
  pinMode(OUT_PIN_LEFT_UP, OUTPUT);
  pinMode(OUT_PIN_RIGHT_DOWN, OUTPUT);
  pinMode(OUT_PIN_RIGHT_UP, OUTPUT);


  // OEM Wiring inputs to detect initial state of headlights
  pinMode(LEFT_DOWN_INPUT, INPUT_PULLUP);
  pinMode(LEFT_UP_INPUT, INPUT_PULLUP);
  pinMode(RIGHT_DOWN_INPUT, INPUT_PULLUP);
  pinMode(RIGHT_UP_INPUT, INPUT_PULLUP);

  NimBLEDevice::init("Winkduino");
  NimBLEDevice::setDeviceName("Winkduino");

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

  initialReadLeftDown = digitalRead(LEFT_DOWN_INPUT);
  initialReadLeftUp = digitalRead(LEFT_UP_INPUT);
  initialReadRightDown = digitalRead(RIGHT_DOWN_INPUT);
  initialReadRightUp = digitalRead(RIGHT_UP_INPUT);

  if (initialReadLeftDown == LOW) leftStatus = 0;
  else if (initialReadLeftUp == LOW) leftStatus = 1;

  if (initialReadRightDown == LOW) rightStatus = 0;
  else if (initialReadRightUp == LOW) rightStatus = 1;

  updateHeadlightChars();

  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  leftSleepChar->setCallbacks(new LeftSleepCharacteristicCallbacks());
  rightSleepChar->setCallbacks(new RightSleepCharacteristicCallbacks());
  longTermSleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());
  // manualSleepChar->setCallbacks(new ManualSleepCharacteristicCallbacks())

  pService->start();

  NimBLEExtAdvertisement extAdv(primaryPhy, secondaryPhy);

  extAdv.setConnectable(true);
  extAdv.setScannable(false);

  extAdv.setCompleteServices({ NimBLEUUID(SERVICE_UUID) });

  NimBLEExtAdvertising *pAdvertising = NimBLEDevice::getAdvertising();

  pAdvertising->setCallbacks(new advertisingCallbacks);

  t = millis();

  esp_sleep_enable_timer_wakeup(sleepTime_us);

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



void loop()
{
  int readLeftDown = digitalRead(LEFT_DOWN_INPUT);
  int readLeftUp = digitalRead(LEFT_UP_INPUT);
  int readRightDown = digitalRead(RIGHT_DOWN_INPUT);
  int readRightUp = digitalRead(RIGHT_UP_INPUT);

  if (((readLeftDown != initialReadLeftDown) && (readRightDown != initialReadRightDown)) && ((readLeftUp != initialReadLeftUp) && (readRightUp != initialReadRightUp))) {
    busyChar->setValue("1");
    busyChar->notify();
    if ((readLeftDown == HIGH && readRightDown == HIGH)) {
      printf("BOTH UP\n");
      bothUp();
    } else if ((readLeftDown == LOW && readRightDown == LOW)) {
      printf("BOTH DOWN\n");
      bothDown();
    }


    delay(HEADLIGHT_MOVEMENT_DELAY);
    setAllOff();

    initialReadLeftDown = readLeftDown;
    initialReadRightDown = readRightDown;
    initialReadLeftUp = readLeftUp;
    initialReadRightUp = readRightUp;
    updateHeadlightChars();
    busyChar->setValue("0");
    busyChar->notify();
  } 

  if (!deviceConnected && (millis() - t) > advertiseTime_ms) {
    printf("Deep sleep starting...\n");
    if (deviceConnected) return;
    delay(100);
    if (!deviceConnected)
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
  // App forces headlights to be up, in order to send these two commands
  // Left Down
  digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  updateHeadlightChars();
  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);

  // Left back up
  // Right down at same
  digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  updateHeadlightChars();

  delay(HEADLIGHT_MOVEMENT_DELAY);

  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, HIGH);

  updateHeadlightChars();
  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);

  // Turn left off
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  // Right back up
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
}

void rightWave()
{
  digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);

  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);

  // Left back up
  // Right down at same
  digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);

  delay(HEADLIGHT_MOVEMENT_DELAY);

  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, HIGH);
  // Wait
  delay(HEADLIGHT_MOVEMENT_DELAY);

  // Turn left off
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  // Right back up
  digitalWrite(OUT_PIN_LEFT_UP, HIGH);
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
}

void setAllOff()
{
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
}
