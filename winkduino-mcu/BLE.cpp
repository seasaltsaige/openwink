#include <string>
#include "NimBLELocalValueAttribute.h"
#include "NimBLECharacteristic.h"
#include "nimble/nimble/include/nimble/hci_common.h"
#include "esp_bt.h"
#include "NimBLEDevice.h"
#include "NimBLEServer.h"
#include "BLE.h"
#include "Storage.h"
#include "BLECallbacks.h"
#include "constants.h"


using namespace std;

#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif


RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;

NimBLEServer* WinkduinoBLE::server;

NimBLEExtAdvertisement WinkduinoBLE::advertisement;
NimBLEExtAdvertising* WinkduinoBLE::advertising;

NimBLEService* WinkduinoBLE::winkService;
// WINK CHARACTERISTICS
NimBLECharacteristic* WinkduinoBLE::winkChar;
NimBLECharacteristic* WinkduinoBLE::busyChar;
NimBLECharacteristic* WinkduinoBLE::leftStatusChar;
NimBLECharacteristic* WinkduinoBLE::rightStatusChar;
NimBLECharacteristic* WinkduinoBLE::sleepChar;
// NimBLECharacteristic* WinkduinoBLE::leftSleepChar;
// NimBLECharacteristic* WinkduinoBLE::rightSleepChar;
NimBLECharacteristic* WinkduinoBLE::syncChar;


NimBLEService* WinkduinoBLE::otaService;
// OTA CHARACTERISTICS
NimBLECharacteristic* WinkduinoBLE::otaUpdateChar;
NimBLECharacteristic* WinkduinoBLE::firmwareUpdateNotifier;
NimBLECharacteristic* WinkduinoBLE::firmwareStatus;
NimBLECharacteristic* WinkduinoBLE::firmwareChar;


NimBLEService* WinkduinoBLE::settingsService;
// SETTINGS CHARACTERISTICS
NimBLECharacteristic* WinkduinoBLE::longTermSleepChar;
NimBLECharacteristic* WinkduinoBLE::customButtonChar;
NimBLECharacteristic* WinkduinoBLE::headlightDelayChar;
NimBLECharacteristic* WinkduinoBLE::headlightMotionChar;
NimBLECharacteristic* WinkduinoBLE::sleepSettingsChar;

bool WinkduinoBLE::deviceConnected = false;

void WinkduinoBLE::init(string deviceName) {
  NimBLEDevice::init(deviceName);
  initDeviceServer();
  initServerService();
  initServiceCharacteristics();
  initAdvertising();
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
}

void WinkduinoBLE::initDeviceServer() {
  server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
}

void WinkduinoBLE::initServerService() {
  winkService = server->createService(NimBLEUUID(WINK_SERVICE_UUID));
  otaService = server->createService(NimBLEUUID(OTA_SERVICE_UUID));
  settingsService = server->createService(NimBLEUUID(MODULE_SETTINGS_SERVICE_UUID));
}

void WinkduinoBLE::initServiceCharacteristics() {

  winkChar = winkService->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
  sleepChar = winkService->createCharacteristic(SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);

  busyChar = winkService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  leftStatusChar = winkService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  rightStatusChar = winkService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  syncChar = winkService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE);

  syncChar->setValue(0);
  winkChar->setValue(0);

  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  sleepChar->setCallbacks(new SleepCharacteristicCallbacks());

  otaUpdateChar = otaService->createCharacteristic(OTA_UUID, NIMBLE_PROPERTY::WRITE);
  firmwareChar = otaService->createCharacteristic(FIRMWARE_UUID, NIMBLE_PROPERTY::READ);
  firmwareUpdateNotifier = otaService->createCharacteristic(SOFTWARE_UPDATING_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  firmwareStatus = otaService->createCharacteristic(SOFTWARE_STATUS_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);

  firmwareChar->setValue(FIRMWARE_VERSION);
  firmwareStatus->setValue("idle");
  otaUpdateChar->setCallbacks(new OTAUpdateCharacteristicCallbacks());


  longTermSleepChar = settingsService->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE);
  customButtonChar = settingsService->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE);
  headlightDelayChar = settingsService->createCharacteristic(HEADLIGHT_MOVEMENT_DELAY_UUID, NIMBLE_PROPERTY::WRITE);
  headlightMotionChar = settingsService->createCharacteristic(HEADLIGHT_MOTION_IN_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  sleepSettingsChar = settingsService->createCharacteristic(SLEEPY_SETTINGS_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);


  headlightMotionChar->setValue(HEADLIGHT_MOVEMENT_DELAY);
  headlightDelayChar->setValue(headlightMultiplier);

  string sleepCharStart = to_string(leftSleepyValue) + "-" + to_string(rightSleepyValue);
  sleepSettingsChar->setValue(sleepCharStart);

  longTermSleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());
  customButtonChar->setCallbacks(new CustomButtonPressCharacteristicCallbacks());
  headlightDelayChar->setCallbacks(new HeadlightCharacteristicCallbacks());
  sleepSettingsChar->setCallbacks(new SleepSettingsCallbacks());
}

void WinkduinoBLE::initAdvertising() {
  winkService->start();
  otaService->start();
  settingsService->start();

  advertisement.setName("Winkduino");

  advertisement.setConnectable(true);
  advertisement.setScannable(false);

  advertisement.setPrimaryPhy(BLE_HCI_LE_PHY_1M);
  advertisement.setSecondaryPhy(BLE_HCI_LE_PHY_CODED);

  advertisement.addServiceUUID(NimBLEUUID(WINK_SERVICE_UUID));
  advertisement.addServiceUUID(NimBLEUUID(OTA_SERVICE_UUID));
  advertisement.addServiceUUID(NimBLEUUID(MODULE_SETTINGS_SERVICE_UUID));

  advertising = NimBLEDevice::getAdvertising();
  advertising->setCallbacks(new AdvertisingCallbacks());
}

void WinkduinoBLE::start() {
  if (advertising->setInstanceData(0, advertisement)) {
    if (advertising->start(0)) {
      printf("Started advertising\n");
      WinkduinoBLE::updateHeadlightChars();
      WinkduinoBLE::setMotionInValue(HEADLIGHT_MOVEMENT_DELAY);
    } else
      printf("Failed to start advertising\n");
  } else
    printf("Failed to register advertisement data\n");
}

void WinkduinoBLE::updateHeadlightChars() {
  leftStatusChar->setValue(std::string(String(leftStatus).c_str()));
  rightStatusChar->setValue(std::string(String(rightStatus).c_str()));
  leftStatusChar->notify();
  rightStatusChar->notify();
}

void WinkduinoBLE::setMotionInValue(int value) {
  if (value < 500 || value > 800) return;
  HEADLIGHT_MOVEMENT_DELAY = value;
  // Storage::setMotionTiming(value);

  Serial.printf("Timer Value: %d\n", value);
  headlightMotionChar->setValue(to_string(value));
  headlightMotionChar->notify();
}

void WinkduinoBLE::setBusy(bool busy) {
  if (busy) {
    busyChar->setValue("1");
  } else {
    busyChar->setValue("0");
  }
  busyChar->notify();
}

void WinkduinoBLE::setFirmwareUpdateStatus(string status) {
  firmwareStatus->setValue(status.c_str());
  firmwareStatus->notify();
}

void WinkduinoBLE::setFirmwarePercent(string stringPercentage) {
  firmwareUpdateNotifier->setValue(stringPercentage);
  firmwareUpdateNotifier->notify();
}
