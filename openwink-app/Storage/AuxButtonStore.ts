import { buttonBehaviorMap } from "../helper/Constants";
import { ButtonBehaviors, CommandOutput } from "../helper/Types";
import Storage from "./Storage";

export enum AUX_ID {
  AUX1 = 1,
  AUX2,
}

export enum AUX_SWITCH_TYPE {
  LATCHING,
  MOMENTARY,
}

const AUX_BUTTON_KEY = "aux-button";
const AUX_LOOP_KEY = "aux-loop";
const AUX_TYPE_KEY = "aux-type";

export abstract class AuxButtonStore {

  static getStatus(): boolean {
    const enabled = Storage.getBoolean(AUX_BUTTON_KEY);
    return enabled ? true : false;
  }
  static enable() {
    Storage.set(AUX_BUTTON_KEY, true);
  }
  static disable() {
    Storage.delete(AUX_BUTTON_KEY);
  }


  static getAuxButtonLoop(aux: AUX_ID): boolean {
    const stored = Storage.getBoolean(`${AUX_LOOP_KEY}-${aux}`);
    if (stored) return true;
    else return false;
  }

  static setAuxButtonLoop(aux: AUX_ID, loop: boolean): void {
    if (loop) Storage.set(`${AUX_LOOP_KEY}-${aux}`, loop);
    else Storage.delete(`${AUX_LOOP_KEY}-${aux}`);
  }

  static getAuxButtonType(aux: AUX_ID): AUX_SWITCH_TYPE {
    const stored = Storage.getBoolean(`${AUX_TYPE_KEY}-${aux}`);
    if (stored === false) return AUX_SWITCH_TYPE.LATCHING;
    return AUX_SWITCH_TYPE.MOMENTARY;
  }

  static setAuxButtonType(aux: AUX_ID, type: AUX_SWITCH_TYPE): void {
    Storage.set(`${AUX_TYPE_KEY}-${aux}`, type === AUX_SWITCH_TYPE.MOMENTARY);
  }

  static getAuxButtonAction(aux: AUX_ID): ButtonBehaviors | CommandOutput {
    const stored = Storage.getString(`${AUX_BUTTON_KEY}-${aux}`);

    // Return defaults if not set
    if (!stored) {
      if (aux === AUX_ID.AUX1)
        return "Left Wink";
      else 
        return "Right Wink";
    }

    // Default built-in action ("<number>_<action>")
    if (/^\d+_/.test(stored)) {
      const splitIdx = stored.indexOf("_");
      const action = stored.slice(splitIdx + 1) as ButtonBehaviors;
      if (action in buttonBehaviorMap) {
        return action;
      }
    }

    // Custom command
    const parts = stored.split("-");
    let cmdStartIndex = parts.length;
    while (cmdStartIndex > 1 && /^(d\d+(\.\d+)?|\d+)$/.test(parts[cmdStartIndex - 1])) {
      cmdStartIndex--;
    }
    const name = parts.slice(0, cmdStartIndex).join("-");
    const commandParts = parts.slice(cmdStartIndex);

    const customCmd: CommandOutput = {
      name,
      command: [],
    }

    for (const cmdSection of commandParts) {
      if (cmdSection.startsWith("d"))
        customCmd.command?.push({ delay: parseFloat(cmdSection.slice(1, cmdSection.length)) });
      else
        customCmd.command?.push({ transmitValue: parseInt(cmdSection) });
    }

    return customCmd;
  }
  
  static setAuxButtonAction(aux: AUX_ID, action: ButtonBehaviors | CommandOutput): void {
    if (typeof action === "object") {
      // Convert CommandOutput into string
      const commandString = action.command?.map(value => value.delay ? `d${value.delay}` : value.transmitValue).join("-");

      if (commandString)
        // Name is needed for display on app. Not needed for transmission to MCU
        Storage.set(`${AUX_BUTTON_KEY}-${aux}`, `${action.name}-${commandString}`);
    } else
      Storage.set(`${AUX_BUTTON_KEY}-${aux}`, `${buttonBehaviorMap[action]}_${action}`);
  }

  static deleteAux(aux: AUX_ID): void {
    Storage.delete(`${AUX_BUTTON_KEY}-${aux}`);
  }


  static reset(): void {
    this.deleteAux(AUX_ID.AUX1);
    this.deleteAux(AUX_ID.AUX2);
    this.setAuxButtonLoop(AUX_ID.AUX1, false);
    this.setAuxButtonLoop(AUX_ID.AUX2, false);
    this.setAuxButtonType(AUX_ID.AUX1, AUX_SWITCH_TYPE.MOMENTARY);
    this.setAuxButtonType(AUX_ID.AUX2, AUX_SWITCH_TYPE.MOMENTARY);
    this.disable();
  }
}