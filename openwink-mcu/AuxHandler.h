#pragma once
#include <Arduino.h>

#include "esp32-hal-gpio.h"
#include <string>
#include "esp_sleep.h"
#include "ButtonHandler.h"
#include "constants.h"

using namespace std;

class AuxHandler {
  private:
    // general on/off status
    static bool auxStatus;
    // action to execute
    static string aux1action;
    static string aux2action;
    // whether action is loop enabled
    static bool aux1loop;
    static bool aux2loop;
    // type of switch (0 = latching, 1 = momentary)
    static int aux1type;
    static int aux2type;

    static int lastAux1Status;
    static int lastAux2Status;
  public:
    static void setAuxiliaryButtonsStatus(bool status);

    static void setupAuxGPIO() {
      if (getAuxStatus()) {
        pinMode(AUX1_INPUT, INPUT);
        pinMode(AUX2_INPUT, INPUT);
      }
    }
    static void setAuxSideAction(int side, string action);
    static void setAuxLoop(int side, bool loop);
    static void setAuxType(int side, int type);
    static void loopAuxHandler();
    static void auxReadWakeup();
    static void readWakeupReason() {
      if (!auxStatus) return;

      esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();

      if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT1)
        awakeTime_ms = 5 * 1000 * 60;
      else
        awakeTime_ms = 0;
    }
    static bool getAuxStatus() { return auxStatus; };
    static bool getAuxLoop(int side) { return (side == 1) ? aux1loop : (side == 2) ? aux2loop : false; };
    static int getAuxType(int side) { return (side == 1) ? aux1type : (side == 2) ? aux2type : 0; };
};