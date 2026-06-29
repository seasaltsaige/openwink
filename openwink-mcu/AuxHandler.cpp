#include "esp32-hal-gpio.h"
#include "AuxHandler.h"
#include "Arduino.h"
#include "CommandHandler.h"
#include "BLECallbacks.h"
#include "ButtonHandler.h"
#include "driver/gpio.h" 
#include "constants.h"
#include "BLE.h"
#include "MainFunctions.h"
#include <string>

using namespace std;

bool AuxHandler::auxStatus = false;
string AuxHandler::aux1action = string("2");
string AuxHandler::aux2action = string("4");

// whether action is loop enabled
RTC_DATA_ATTR bool AuxHandler::aux1loop = false;
RTC_DATA_ATTR bool AuxHandler::aux2loop = false;
// type of switch (0 = latching, 1 = momentary)
RTC_DATA_ATTR int AuxHandler::aux1type = 0;
RTC_DATA_ATTR int AuxHandler::aux2type = 0;

RTC_DATA_ATTR int AuxHandler::lastAux1Status = -1;
RTC_DATA_ATTR int AuxHandler::lastAux2Status = -1;


bool lastAuxStatus = false;


// TODO: change left status/right status updates from initialButton
// thats not what it uses here dumb
void handleAuxFunction(string response, int aux) {
  
  if (response == "10") {
    if (isSleepy())
      sleepyReset(true, true);
    else
      sleepyEye(true, true);
    return;
    
  } else if (response == "11") {
    // Left-Right
    if (isSleepy()) sleepyReset(true, true);
    if (leftStatus == 0) rightDown();
    else rightUp();

    if (leftStatus == 0) {
      leftUp();
      bothSwap();
      bothSwap();
      leftDown();
    } else {
      leftDown();
      bothSwap();
      bothSwap();
      leftUp();
    }
    return;
    
  } else if (response == "13") {
    // Left-Right x2
    if (isSleepy()) sleepyReset(true, true);
    if (leftStatus == 0) rightDown();
    else rightUp();

    if (leftStatus == 0) {
      leftUp();
      bothSwap();
      bothSwap();
    } else {
      leftDown();
      bothSwap();
      bothSwap();
    }

    bothSwap();
    bothSwap();

    if (leftStatus == 0) {
      leftUp();
    } else {
      leftDown();
    }

    

    return;
  } else if (response == "14") {
    // Right-Left
    if (isSleepy()) sleepyReset(true, true);
    if (rightStatus == 0) leftDown();
    else leftUp();

    if (rightStatus == 0) {
      rightUp();
      bothSwap();
      bothSwap();
      rightDown();
    } else {
      rightDown();
      bothSwap();
      bothSwap();
      rightUp();
    }
    return;
  } else if (response == "15") {
    // Right-Left x2
    if (isSleepy()) sleepyReset(true, true);
    if (rightStatus == 0) leftDown();
    else leftUp();

    if (rightStatus == 0) {
      rightUp();
      bothSwap();
      bothSwap();
    } else {
      rightDown();
      bothSwap();
      bothSwap();
    }

    bothSwap();
    bothSwap();

    
    if (rightStatus == 0) {
      rightUp();
    } else {
      rightDown();
    }

    return;
  }

  if (response.length() == 1) {
    int parsed = stoi(response);
    bool wasSleepy = false;
    if (isSleepy()) {
      sleepyReset(true, true);
      if (parsed != 1)
        wasSleepy = true;
    }

    BLE::setBusy(true);

    switch (parsed) {
    case 1:
      if (initialButton == 1) {
        bothUp();
      } else if (initialButton == 0) {
        bothDown();
      }

      rightStatus = initialButton;
      leftStatus = initialButton;
      break;

    case 2:
      leftWink();
      break;

    case 3:
      leftWink();
      leftWink();
      break;

    case 4:
      rightWink();
      break;

    case 5:
      rightWink();
      rightWink();
      break;

    case 6:
      bothBlink();
      break;

    case 7:
      bothBlink();
      bothBlink();
      break;

    case 8:
      if (leftStatus != rightStatus) {
        if (leftStatus == 1)
          rightUp();
        else
          rightDown();
        setAllOff();
        BLE::updateHeadlightChars();
      }
      waveHeadlights(WAVE_START_SIDE::LEFT);
      break;

    case 9:
      if (leftStatus != rightStatus) {
        if (rightStatus == 1)
          leftUp();
        else
          leftDown();
        setAllOff();
        BLE::updateHeadlightChars();
      }
      waveHeadlights(WAVE_START_SIDE::RIGHT);
      break;
    }

    if (wasSleepy)
      sleepyEye(true, true);

      
    setAllOff();

    BLE::updateHeadlightChars();
    BLE::setBusy(false);
  } else {
    if (aux == 1 && AuxHandler::getAuxLoop(1))
      CommandHandler::custom_command_loop = true;
    else if (aux == 2 && AuxHandler::getAuxLoop(2))
      CommandHandler::custom_command_loop = true;
    else CommandHandler::custom_command_loop = false;

    // Queue command
    queuedCustomCommand = response;
  }
}


void AuxHandler::setAuxiliaryButtonsStatus(bool status) {

  lastAuxStatus = auxStatus;
  auxStatus = status;

  if (status) {
    pinMode(AUX1_INPUT, INPUT);
    pinMode(AUX2_INPUT, INPUT);
    lastAux1Status = -1;
    lastAux2Status = -1;
  } else {
    gpio_reset_pin((gpio_num_t)AUX1_INPUT);
    gpio_reset_pin((gpio_num_t)AUX2_INPUT);
  }
}

void AuxHandler::setAuxSideAction(int side, string action) {
  if (side == 1) {
    aux1action = action;
  } else if (side == 2) {
    aux2action = action;
  } else return;
}

void AuxHandler::setAuxLoop(int side, bool loop) {
  if (side == 1) {
    aux1loop = loop;
  } else if (side == 2) {
    aux2loop = loop;
  } else return;
}

void AuxHandler::setAuxType(int side, int type) {
  if (side == 1) {
    aux1type = type;
  } else if (side == 2) {
    aux2type = type;
  } else return;
}

void AuxHandler::loopAuxHandler() {
  if (!auxStatus) return;

  // weird behavior enabling Aux buttons from app
  // this prevents the initial read from coming back as wrong
  // simply discarding it
  // yes this is cursed, but otherwise it triggers one of the aux handlers
  if (lastAuxStatus != auxStatus) {
    delay(100);
    lastAuxStatus = auxStatus;
    return;
  }

  // when read = 0, button was pressed (external pullup)
  int aux1 = digitalRead(AUX1_INPUT);
  int aux2 = digitalRead(AUX2_INPUT);

  if (lastAux1Status != aux1 || lastAux2Status != aux2) {
    // Pressed/toggled
    if (aux1 == 0) {
      if (ButtonHandler::customCommandActive) {
        CommandHandler::custom_command_loop = false;
        ButtonHandler::setCustomCommandActive(false);  
      } else {
        handleAuxFunction(aux1action, 1);
        ButtonHandler::mainTimer = millis();
      }
    // latching, untoggled, loop enabled
    } else if (aux1 == 1 && aux1type == 0 && aux1loop) {
      // Cancel command if running/looping
      CommandHandler::custom_command_loop = false;
      ButtonHandler::setCustomCommandActive(false);

    // Pressed/toggled
    } else if (aux2 == 0) {
      if (ButtonHandler::customCommandActive) {
        CommandHandler::custom_command_loop = false;
        ButtonHandler::setCustomCommandActive(false);  
      } else {
        handleAuxFunction(aux2action, 2);
        ButtonHandler::mainTimer = millis();
      }
    // latching, untoggled, loop enabled
    } else if (aux2 == 1 && aux2type == 0 && aux2loop) {
      // Cancel command if running/looping
      CommandHandler::custom_command_loop = false;
      ButtonHandler::setCustomCommandActive(false);
    }
  }

  lastAux1Status = aux1;
  lastAux2Status = aux2;
}

void AuxHandler::auxReadWakeup() {
  if (!auxStatus) return;

  // when read = 0, button was pressed (external pullup)
  int aux1 = digitalRead(AUX1_INPUT);
  int aux2 = digitalRead(AUX2_INPUT);

  if (lastAux1Status != aux1 || lastAux2Status != aux2) {
    // Pressed/toggled
    if (aux1 == 0) {
      if (ButtonHandler::customCommandActive) {
        CommandHandler::custom_command_loop = false;
        ButtonHandler::setCustomCommandActive(false);  
      } else {
        handleAuxFunction(aux1action, 1);
        ButtonHandler::mainTimer = millis();
      }
    // latching, untoggled, loop enabled
    } else if (aux1 == 1 && aux1type == 0 && aux1loop) {
      // Cancel command if running/looping
      CommandHandler::custom_command_loop = false;
      ButtonHandler::setCustomCommandActive(false);

    // Pressed/toggled
    } else if (aux2 == 0) {
      if (ButtonHandler::customCommandActive) {
        CommandHandler::custom_command_loop = false;
        ButtonHandler::setCustomCommandActive(false);  
      } else {
        handleAuxFunction(aux2action, 2);
        ButtonHandler::mainTimer = millis();
      }
    // latching, untoggled, loop enabled
    } else if (aux2 == 1 && aux2type == 0 && aux2loop) {
      // Cancel command if running/looping
      CommandHandler::custom_command_loop = false;
      ButtonHandler::setCustomCommandActive(false);
    }
  }

  lastAux1Status = aux1;
  lastAux2Status = aux2;
}