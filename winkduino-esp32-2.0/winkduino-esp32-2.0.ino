#include <string.h>
#include <Arduino.h>

#include "driver/rtc_io.h"
#include "driver/gpio.h"

#include "constants.h"
#include "WifiUpdateServer.h"
#include "Storage.h"
#include "MainFunctions.h"
#include "BLE.h"
#include "ButtonHandler.h"
#include "BLECallbacks.h"

using namespace std;

void setup() {
  Serial.begin(115200);

  ButtonHandler::init();

  ButtonHandler::readWakeUpReason();

  Storage::begin("oem-store");
  Storage::getFromStorage();

  // Might not be necessary since deep sleep is more or less a reboot
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

  ButtonHandler::setupGPIO();

  setCpuFrequencyMhz(80);

  WinkduinoBLE::init("Winkduino");

  esp_sleep_enable_timer_wakeup(sleepTime_us);

  ButtonHandler::readOnWakeup();

  printf("Version %s\n", FIRMWARE_VERSION);

  WinkduinoBLE::start();
}

void loop() {

  if (WifiUpdateServer::getWifiStatus())
    WifiUpdateServer::handleHTTPClient();

  ButtonHandler::loopButtonHandler();

  ButtonHandler::updateButtonSleep();
}