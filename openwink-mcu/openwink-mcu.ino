#include <string.h>
#include <Arduino.h>
#include "esp_mac.h"

#include "constants.h"
#include "Storage.h"
#include "MainFunctions.h"
#include "BLE.h"
#include "ButtonHandler.h"
#include "BLECallbacks.h"
#include "CommandHandler.h"
// #include "esp_gatts_api.h"
// #include "esp_gatt_defs.h"

using namespace std;

void motionInMonitorTask(void* params);

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

  ButtonHandler::setupGPIO();
  ButtonHandler::readWakeUpReason();
  ButtonHandler::readOnWakeup();

  setCpuFrequencyMhz(80);


  esp_sleep_enable_timer_wakeup(sleepTime_us);

  printf("Version %s\n", FIRMWARE_VERSION);

  BLE::start();

  // xTaskCreatePinnedToCore(
  //   motionInMonitorTask,
  //   "MotionInTask",
  //   4096,
  //   nullptr,
  //   1,
  //   nullptr,
  //   1);

}

void motionInMonitorTask(void* params) {
  for (;;) {
    ButtonHandler::handleBusyInput();
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

void loop() {

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

  ButtonHandler::handleResetLogic();
  ButtonHandler::loopButtonHandler();
  ButtonHandler::updateButtonSleep();
}