#include "BLE.h"
#include "BLECallbacks.h"
#include "NimBLECharacteristic.h"
#include "NimBLEDevice.h"
#include "NimBLELocalValueAttribute.h"
#include "NimBLEServer.h"
#include "Storage.h"
#include "constants.h"
#include "esp_bt.h"
#include <string>

using namespace std;

#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif

RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;

NimBLEServer *BLE::server;

NimBLEExtAdvertisement BLE::advertisement;
NimBLEExtAdvertising *BLE::advertising;

NimBLEService *BLE::winkService;
// WINK CHARACTERISTICS
NimBLECharacteristic *BLE::winkChar;
NimBLECharacteristic *BLE::busyChar;
NimBLECharacteristic *BLE::leftStatusChar;
NimBLECharacteristic *BLE::rightStatusChar;
NimBLECharacteristic *BLE::sleepChar;
NimBLECharacteristic *BLE::customCommandChar;
NimBLECharacteristic *BLE::syncChar;

NimBLEService *BLE::otaService;
// OTA CHARACTERISTICS
NimBLECharacteristic *BLE::otaUpdateChar;
NimBLECharacteristic *BLE::firmwareUpdateNotifier;
NimBLECharacteristic *BLE::firmwareStatus;
NimBLECharacteristic *BLE::firmwareChar;

NimBLEService *BLE::settingsService;
// SETTINGS CHARACTERISTICS
NimBLECharacteristic *BLE::longTermSleepChar;
NimBLECharacteristic *BLE::customButtonChar;
NimBLECharacteristic *BLE::headlightDelayChar;
NimBLECharacteristic *BLE::headlightMotionChar;
NimBLECharacteristic *BLE::sleepSettingsChar;
NimBLECharacteristic *BLE::unpairChar;
NimBLECharacteristic *BLE::resetChar;
NimBLECharacteristic *BLE::clientMacChar;

bool BLE::deviceConnected = false;

void BLE::init(string deviceName) {
  NimBLEDevice::init(deviceName);
  NimBLEDevice::setMTU(247);
  initDeviceServer();
  initServerService();
  initServiceCharacteristics();
  initAdvertising();
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
}

void BLE::initDeviceServer() {
  server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
}

void BLE::initServerService() {
  winkService = server->createService(NimBLEUUID(WINK_SERVICE_UUID));
  otaService = server->createService(NimBLEUUID(OTA_SERVICE_UUID));
  settingsService = server->createService(NimBLEUUID(MODULE_SETTINGS_SERVICE_UUID));
}

void BLE::initServiceCharacteristics() {

  winkChar = winkService->createCharacteristic(HEADLIGHT_CHAR_UUID, NIMBLE_PROPERTY::WRITE_NR);
  sleepChar = winkService->createCharacteristic(SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE_NR);

  busyChar = winkService->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  leftStatusChar = winkService->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  rightStatusChar = winkService->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  syncChar = winkService->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE_NR);
  customCommandChar = winkService->createCharacteristic(CUSTOM_COMMAND_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE_NR);

  syncChar->setValue(0);
  winkChar->setValue(0);
  customCommandChar->setValue("0");

  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  sleepChar->setCallbacks(new SleepCharacteristicCallbacks());
  customCommandChar->setCallbacks(new CustomCommandCharacteristicCallbacks());

  otaUpdateChar = otaService->createCharacteristic(OTA_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  firmwareChar = otaService->createCharacteristic(FIRMWARE_UUID, NIMBLE_PROPERTY::READ);
  firmwareUpdateNotifier = otaService->createCharacteristic(SOFTWARE_UPDATING_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  firmwareStatus = otaService->createCharacteristic(SOFTWARE_STATUS_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);

  firmwareChar->setValue(FIRMWARE_VERSION);
  firmwareStatus->setValue("idle");
  otaUpdateChar->setCallbacks(new OTAUpdateCharacteristicCallbacks());

  longTermSleepChar = settingsService->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE_NR);
  customButtonChar = settingsService->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE_NR);
  headlightDelayChar = settingsService->createCharacteristic(HEADLIGHT_MOVEMENT_DELAY_UUID, NIMBLE_PROPERTY::WRITE_NR);
  headlightMotionChar = settingsService->createCharacteristic(HEADLIGHT_MOTION_IN_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  sleepSettingsChar = settingsService->createCharacteristic(SLEEPY_SETTINGS_UUID, NIMBLE_PROPERTY::WRITE_NR | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  unpairChar = settingsService->createCharacteristic(UNPAIR_UUID, NIMBLE_PROPERTY::WRITE_NR);
  resetChar = settingsService->createCharacteristic(RESET_UUID, NIMBLE_PROPERTY::WRITE_NR);
  clientMacChar = settingsService->createCharacteristic(CLIENT_MAC_UUID, NIMBLE_PROPERTY::WRITE_NR | NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);

  headlightMotionChar->setValue(HEADLIGHT_MOVEMENT_DELAY);
  headlightDelayChar->setValue(headlightMultiplier);

  string sleepCharStart = to_string(leftSleepyValue) + "-" + to_string(rightSleepyValue);
  sleepSettingsChar->setValue(sleepCharStart);

  longTermSleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());
  customButtonChar->setCallbacks(new CustomButtonPressCharacteristicCallbacks());
  headlightDelayChar->setCallbacks(new HeadlightCharacteristicCallbacks());
  sleepSettingsChar->setCallbacks(new SleepSettingsCallbacks());
  unpairChar->setCallbacks(new UnpairCharacteristicCallbacks());
  resetChar->setCallbacks(new ResetCharacteristicCallbacks());
  clientMacChar->setCallbacks(new ClientMacCharacteristicCallbacks());
}

void BLE::initAdvertising() {
  winkService->start();
  otaService->start();
  settingsService->start();

  advertisement.setName("OpenWink");

  advertisement.setConnectable(true);
  advertisement.setScannable(false);

  advertisement.setPrimaryPhy(BLE_HCI_LE_PHY_1M);
  advertisement.setSecondaryPhy(BLE_HCI_LE_PHY_2M);

  advertisement.addServiceUUID(NimBLEUUID(WINK_SERVICE_UUID));
  advertisement.addServiceUUID(NimBLEUUID(OTA_SERVICE_UUID));
  advertisement.addServiceUUID(NimBLEUUID(MODULE_SETTINGS_SERVICE_UUID));

  advertising = NimBLEDevice::getAdvertising();
  advertising->setCallbacks(new AdvertisingCallbacks());
}

void BLE::start() {
  if (advertising->setInstanceData(0, advertisement)) {
    if (advertising->start(0)) {
      printf("Started advertising\n");
      BLE::setMotionInValue(HEADLIGHT_MOVEMENT_DELAY);
    } else printf("Failed to start advertising\n");
  } else printf("Failed to register advertisement data\n");
}

void BLE::updateHeadlightChars() {
  leftStatusChar->setValue(std::string(String(leftStatus).c_str()));
  rightStatusChar->setValue(std::string(String(rightStatus).c_str()));
  leftStatusChar->notify();
  rightStatusChar->notify();
}

void BLE::setMotionInValue(int value) {
  if (value < 500 || value > 800)
    return;
  HEADLIGHT_MOVEMENT_DELAY = value;
  headlightMotionChar->setValue(to_string(value));
  headlightMotionChar->notify();
}

void BLE::setBusy(bool busy) {
  if (busy) {
    busyChar->setValue("1");
  } else {
    busyChar->setValue("0");
  }
  busyChar->notify();
}

void BLE::setFirmwareUpdateStatus(string status) {
  firmwareStatus->setValue(status.c_str());
  firmwareStatus->notify();
}

void BLE::setFirmwarePercent(string stringPercentage) {
  firmwareUpdateNotifier->setValue(stringPercentage);
  firmwareUpdateNotifier->notify();
}
