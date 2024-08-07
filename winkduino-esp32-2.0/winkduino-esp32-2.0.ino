#include <NimBLEDevice.h>
#include <Arduino.h>

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

#define BUTTON_PULL_UP 8

int leftStatus = 0;
int rightStatus = 0;

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

// #define RESET_CHAR_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51522"

#define LEFT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51523"
#define RIGHT_STATUS_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51524"

#define SLEEPY_EYE_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51525"
#define SYNC_UUID "a144c6b1-5e1a-4460-bb92-3674b2f51526"

#define HEADLIGHT_MOVEMENT_DELAY 750

NimBLECharacteristic *leftChar = nullptr;
NimBLECharacteristic *rightChar = nullptr;

static uint32_t advTime = 100 * 1000;
static uint32_t sleepSeconds = 1;

static uint8_t primaryPhy = BLE_HCI_LE_PHY_CODED;
static uint8_t secondaryPhy = BLE_HCI_LE_PHY_CODED;

/* Handler class for server events */
class ServerCallbacks : public NimBLEServerCallbacks
{
  void onConnect(NimBLEServer *pServer, NimBLEConnInfo &connInfo)
  {
    Serial.printf("Client connected:: %s\n", connInfo.getAddress().toString().c_str());
  };
  void onDisconnect(NimBLEServer *pServer)
  {
    Serial.printf("Client disconnected - sleeping for %" PRIu32 "seconds\n", sleepSeconds);
#ifdef ESP_PLATFORM
    esp_deep_sleep_start();
#else
    systemRestart();
#endif
  };
};

void updateHeadlightChars()
{
  leftChar->setValue(std::string(String(leftStatus).c_str()));
  rightChar->setValue(std::string(String(rightStatus).c_str()));
  leftChar->notify();
  rightChar->notify();
}

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
class SleepCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pChar)
  {
    std::string value = pChar->getValue();
    int headlightValue = String(value.c_str()).toInt();
    double percentage = ((double)headlightValue) / 100;

    // Client blocks this endpoint when headlights are already sleepy

    if (leftStatus == 1 && rightStatus == 1)
    {
      bothDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
    }
    else if (leftStatus == 1)
    {
      leftDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
    }
    else if (rightStatus == 1)
    {
      rightDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
    }

    digitalWrite(OUT_PIN_LEFT_UP, HIGH);
    digitalWrite(OUT_PIN_RIGHT_UP, HIGH);

    delay(percentage * HEADLIGHT_MOVEMENT_DELAY);

    digitalWrite(OUT_PIN_LEFT_UP, LOW);
    digitalWrite(OUT_PIN_RIGHT_UP, LOW);

    leftStatus = headlightValue + 10;
    rightStatus = headlightValue + 10;

    updateHeadlightChars();

    Serial.printf("%.6f", headlightValue);
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
    /* Check the reason advertising stopped, don't sleep if client is connecting */
    printf("Advertising instance %u stopped\n", inst_id);
    switch (reason)
    {
    case 0:
      printf("Client connecting\n");

      bothDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
      bothUp();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
      bothDown();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();
      bothUp();
      delay(HEADLIGHT_MOVEMENT_DELAY);
      setAllOff();

      leftStatus = 1;
      rightStatus = 1;

      updateHeadlightChars();
      return;
    case BLE_HS_ETIMEOUT:
      printf("Time expired - sleeping for %" PRIu32 "seconds\n", sleepSeconds);
      break;
    default:
      printf("Default case");
      break;
    }
#ifdef ESP_PLATFORM
    esp_deep_sleep_start();
#else
    systemRestart(); // nRF platforms restart then sleep via delay in setup.
#endif
  }
};

void setup()
{
  Serial.begin(115200);

  pinMode(OUT_PIN_LEFT_DOWN, OUTPUT);
  pinMode(OUT_PIN_LEFT_UP, OUTPUT);
  pinMode(OUT_PIN_RIGHT_DOWN, OUTPUT);
  pinMode(OUT_PIN_RIGHT_UP, OUTPUT);

  pinMode(BUTTON_PULL_UP, INPUT_PULLUP);

#ifndef ESP_PLATFORM
  delay(sleepSeconds * 1000); // system ON sleep mode for nRF platforms to simulate the esp deep sleep with timer wakeup
#endif

  NimBLEDevice::init("Winkduino");
  NimBLEDevice::setDeviceName("Winkduino");

  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks);
  NimBLEService *pService = pServer->createService(SERVICE_UUID);

  NimBLECharacteristic *winkChar = pService->createCharacteristic(REQUEST_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *sleepChar = pService->createCharacteristic(SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  NimBLECharacteristic *syncChar = pService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE);
  syncChar->setValue(0);
  sleepChar->setValue(0.0);
  winkChar->setValue(0);

  busyChar = pService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  leftChar = pService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  rightChar = pService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);

  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  sleepChar->setCallbacks(new SleepCharacteristicCallbacks());

  pService->start();

  NimBLEExtAdvertisement extAdv(primaryPhy, secondaryPhy);

  extAdv.setConnectable(true);
  extAdv.setScannable(false);

  extAdv.setServiceData(NimBLEUUID(SERVICE_UUID), std::string("Winkduino"));

  extAdv.setCompleteServices16({NimBLEUUID(SERVICE_UUID)});

  NimBLEExtAdvertising *pAdvertising = NimBLEDevice::getAdvertising();

  pAdvertising->setCallbacks(new advertisingCallbacks);

  if (pAdvertising->setInstanceData(0, extAdv))
  {
    if (pAdvertising->start(0, advTime))
    {
      Serial.printf("Started advertising\n");
    }
    else
    {
      Serial.printf("Failed to start advertising\n");
    }
  }
  else
  {
    Serial.printf("Failed to register advertisment data\n");
  }

#ifdef ESP_PLATFORM
  esp_sleep_enable_timer_wakeup(sleepSeconds * 1000000);
#endif
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

// Sleepy eye working!
// void percentageDrop(double percentage) {
//   Serial.println(percentage);
//   Serial.println("IN DROP");

//   digitalWrite(OUT_PIN_LEFT_DOWN, HIGH);
//   digitalWrite(OUT_PIN_RIGHT_DOWN, HIGH);
//   digitalWrite(OUT_PIN_LEFT_UP, LOW);
//   digitalWrite(OUT_PIN_RIGHT_UP, LOW);

//   Serial.println("DOWN");

//   delay(percentage * HEADLIGHT_MOVEMENT_DELAY);

//   Serial.println("ALL OFF");
//   setAllOff();
// }

// ------------------------------------------ //
// HELPER FUNCTIONS //
void setAllOff()
{
  digitalWrite(OUT_PIN_LEFT_DOWN, LOW);
  digitalWrite(OUT_PIN_LEFT_UP, LOW);
  digitalWrite(OUT_PIN_RIGHT_DOWN, LOW);
  digitalWrite(OUT_PIN_RIGHT_UP, LOW);
}

void loop()
{
}