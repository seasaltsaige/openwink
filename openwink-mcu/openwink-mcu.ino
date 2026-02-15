#include "esp_mac.h"
#include <Arduino.h>
#include <string.h>


#include "BLE.h"
#include "BLECallbacks.h"
#include "ButtonHandler.h"
#include "CommandHandler.h"
#include "MainFunctions.h"
#include "Storage.h"
#include "constants.h"

// #include "esp_gatts_api.h"
// #include "esp_gatt_defs.h"

using namespace std;

void motionInMonitorTask(void *params);

void setup() {
  Serial.begin(115200);

  // Variable to store the MAC address
  uint8_t baseMac[6];

  esp_read_mac(baseMac, ESP_MAC_BT);
  Serial.print("Bluetooth MAC: ");
  for (int i = 0; i < 5; i++) {
    Serial.printf("%02X:", baseMac[i]);
  }
  Serial.printf("%02X\n", baseMac[5]);

  ButtonHandler::init();

  Storage::begin("oem-store");
  Storage::getFromStorage();
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);

  BLE::init("OpenWink");

  setCpuFrequencyMhz(80);

  esp_sleep_enable_timer_wakeup(sleepTime_us);

  printf("Version %s\n", FIRMWARE_VERSION);

  BLE::start();

  ButtonHandler::setupGPIO();
  ButtonHandler::readWakeUpReason();
  ButtonHandler::readOnWakeup();

  xTaskCreate(motionInMonitorTask, "MONITOR", 4096, NULL, 1, NULL);
}

void motionInMonitorTask(void *params) {
  for (;;) {
    ButtonHandler::loopLeftMonitor();
    ButtonHandler::loopRightMonitor();
    vTaskDelay(pdMS_TO_TICKS(2.5));
  }
}

void loop() {

  if (auth_status != AuthState::UNCLAIMED &&
      auth_status != AuthState::AUTHENTICATED &&
      (millis() > (authTimer + AUTH_TIME_MS))) {
    NimBLEDevice::getServer()->disconnect(authConnInfo);
    authConnInfo = BLE_HS_CONN_HANDLE_NONE;
  }

  if (otaUpdateRestartQueued) {
    delay(100);
    ESP.restart();
  }

  if (queuedCommand != -1) {
    // handle sent command
    CommandHandler::handleQueuedCommand();
  }
  if (queuedCustomCommand != "")
    CommandHandler::handleQueuedCustomCommand();

  ButtonHandler::loopButtonHandler();
  ButtonHandler::updateButtonSleep();
}