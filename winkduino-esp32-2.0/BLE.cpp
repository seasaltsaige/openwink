#include "BLE.h"
#include "BLECallbacks.h"
#include "constants.h"

using namespace std;

#if !CONFIG_BT_NIMBLE_EXT_ADV
#error Must enable extended advertising, see nimconfig.h file.
#endif


RTC_DATA_ATTR int leftStatus = 0;
RTC_DATA_ATTR int rightStatus = 0;


NimBLEServer* WinkduinoBLE::server;
NimBLEService*  WinkduinoBLE::service;
NimBLEExtAdvertisement WinkduinoBLE::advertisement;
NimBLEExtAdvertising*  WinkduinoBLE::advertising;
NimBLECharacteristic* WinkduinoBLE::winkChar;
NimBLECharacteristic* WinkduinoBLE::leftSleepChar;
NimBLECharacteristic* WinkduinoBLE::rightSleepChar;
NimBLECharacteristic* WinkduinoBLE::syncChar;
NimBLECharacteristic* WinkduinoBLE::longTermSleepChar; 
NimBLECharacteristic* WinkduinoBLE::otaUpdateChar;
NimBLECharacteristic* WinkduinoBLE::customButtonChar;
NimBLECharacteristic* WinkduinoBLE::headlightDelayChar;
NimBLECharacteristic* WinkduinoBLE::firmwareChar;
NimBLECharacteristic* WinkduinoBLE::busyChar;
NimBLECharacteristic* WinkduinoBLE::leftChar;
NimBLECharacteristic* WinkduinoBLE::rightChar;
NimBLECharacteristic* WinkduinoBLE::firmareUpdateNotifier;
NimBLECharacteristic* WinkduinoBLE::firmwareStatus;

void WinkduinoBLE::init(string deviceName) {
  NimBLEDevice::init(deviceName);
  server = NimBLEDevice::createServer();
  service = server->createService(NimBLEUUID(SERVICE_UUID));

  NimBLEExtAdvertisement advertisement(BLE_HCI_LE_PHY_CODED, BLE_HCI_LE_PHY_CODED);

  initDeviceServer();
  initServerService();
  initServiceCharacteristics();
  initAdvertising();
}

void WinkduinoBLE::initDeviceServer() {
  server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
}

void WinkduinoBLE::initServerService() {
  service = server->createService(NimBLEUUID(SERVICE_UUID));
}

void WinkduinoBLE::initServiceCharacteristics() {

  winkChar = service->createCharacteristic(REQUEST_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
  leftSleepChar = service->createCharacteristic(LEFT_SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  rightSleepChar = service->createCharacteristic(RIGHT_SLEEPY_EYE_UUID, NIMBLE_PROPERTY::WRITE);
  syncChar = service->createCharacteristic(SYNC_UUID, NIMBLE_PROPERTY::WRITE);
  longTermSleepChar = service->createCharacteristic(LONG_TERM_SLEEP_UUID, NIMBLE_PROPERTY::WRITE);
  otaUpdateChar = service->createCharacteristic(OTA_UUID, NIMBLE_PROPERTY::WRITE);
  customButtonChar = service->createCharacteristic(CUSTOM_BUTTON_UPDATE_UUID, NIMBLE_PROPERTY::WRITE);
  headlightDelayChar = service->createCharacteristic(HEADLIGHT_MOVEMENT_DELAY_UUID, NIMBLE_PROPERTY::WRITE);
  firmwareChar = service->createCharacteristic(FIRMWARE_UUID, NIMBLE_PROPERTY::READ);
  busyChar = service->createCharacteristic(BUSY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  leftChar = service->createCharacteristic(LEFT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  rightChar = service->createCharacteristic(RIGHT_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  firmareUpdateNotifier = service->createCharacteristic(SOFTWARE_UPDATING_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  firmwareStatus = service->createCharacteristic(SOFTWARE_STATUS_UUID, NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);

  firmwareChar->setValue(FIRMWARE_VERSION);
  headlightDelayChar->setValue(1.0);
  syncChar->setValue(0);
  winkChar->setValue(0);
  firmwareStatus->setValue("idle");


  syncChar->setCallbacks(new SyncCharacteristicCallbacks());
  winkChar->setCallbacks(new RequestCharacteristicCallbacks());
  leftSleepChar->setCallbacks(new LeftSleepCharacteristicCallbacks());
  rightSleepChar->setCallbacks(new RightSleepCharacteristicCallbacks());
  longTermSleepChar->setCallbacks(new LongTermSleepCharacteristicCallbacks());
  otaUpdateChar->setCallbacks(new OTAUpdateCharacteristicCallbacks());
  customButtonChar->setCallbacks(new CustomButtonPressCharacteristicCallbacks());
  headlightDelayChar->setCallbacks(new HeadlightCharacteristicCallbacks());
}

void WinkduinoBLE::initAdvertising() {
  service->start();
  advertisement.setName("Winkduino");
  advertisement.setConnectable(true);
  advertisement.setScannable(false);
  advertisement.setCompleteServices({ NimBLEUUID(SERVICE_UUID) });

  advertising = NimBLEDevice::getAdvertising();
  advertising->setCallbacks(new AdvertisingCallbacks());
}

void WinkduinoBLE::start() {
  if (advertising->setInstanceData(0, advertisement)) {
    if (advertising->start(0))
      printf("Started advertising\n");
    else
      printf("Failed to start advertising\n");
  } else
    printf("Failed to register advertisment data\n");
}

void WinkduinoBLE::updateHeadlightChars() {
  leftChar->setValue(std::string(String(leftStatus).c_str()));
  rightChar->setValue(std::string(String(rightStatus).c_str()));
  leftChar->notify();
  rightChar->notify();
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
  firmareUpdateNotifier->setValue(stringPercentage);
  firmareUpdateNotifier->notify();
}
