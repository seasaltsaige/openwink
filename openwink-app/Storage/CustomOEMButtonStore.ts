import { ButtonBehaviors, CommandOutput, CustomButtonAction, Presses } from "../helper/Types";
import { buttonBehaviorMap } from "../helper/Constants";
import Storage from "./Storage";

const CUSTOM_ENABLED_KEY = "oem-button-custom-enabled";
const CUSTOM_SEEDED_KEY = "oem-button-seeded";
const BUTTON_KEY = "oem-button-values";
const BUTTON_DELAY_KEY = "oem-button-delay";
const BYPASS_KEY = "headlight-bypass";
const LOOPING_KEY = "oem-button-loop";

const DEFAULT_DELAY = 500;

export abstract class CustomOEMButtonStore {
  private static ensureDefaultsSeeded() {
    if (Storage.getBoolean(CUSTOM_SEEDED_KEY)) return;
    Storage.set(CUSTOM_SEEDED_KEY, true);

    const existingKeys = Storage.getAllKeys().filter((key) => key.startsWith(BUTTON_KEY));
    if (existingKeys.length === 0) {
      this.set(1, "Left Wink");
      this.set(2, "Right Wink");
      this.set(3, "Both Blink");
      this.set(4, "Sleepy Eye");
    }
  }

  static isEnabled() {
    const status = Storage.getBoolean(CUSTOM_ENABLED_KEY);
    if (status === undefined) return true;
    return status;
  }

  static enable() {
    Storage.set(CUSTOM_ENABLED_KEY, true);
  }

  static disable() {
    Storage.set(CUSTOM_ENABLED_KEY, false);
  }


  static isBypassEnabled() {
    if (Storage.getBoolean(BYPASS_KEY))
      return true;
    else return false;
  }

  static enableBypass() {
    Storage.set(BYPASS_KEY, true);
  }

  static disableBypass() {
    Storage.delete(BYPASS_KEY);
  }

  static setLooping(presses: Presses, looping: boolean): void {
    if (looping) Storage.set(`${LOOPING_KEY}-${presses}`, looping);
    else Storage.delete(`${LOOPING_KEY}-${presses}`);
  }

  static getLooping(presses: Presses): boolean {
    return Storage.getBoolean(`${LOOPING_KEY}-${presses}`) ? true : false;
  }


  static set(presses: Presses, buttonValue: ButtonBehaviors | CommandOutput): void {
    if (typeof buttonValue === "object") {
      // Convert CommandOutput into string
      const commandString = buttonValue.command?.map(value => value.delay ? `d${value.delay}` : value.transmitValue).join("-");
      if (commandString)
        // Name is needed for display on app. Not needed for transmission to MCU
        Storage.set(`${BUTTON_KEY}-${presses}`, `${buttonValue.name}-${commandString}`);
    } else
      Storage.set(`${BUTTON_KEY}-${presses}`, `${buttonBehaviorMap[buttonValue]}_${buttonValue}`);
  }

  static remove(presses: Presses): void {
    for (let i = presses; i < 8; i++) {
      const nextVal = Storage.getString(`${BUTTON_KEY}-${i + 1}`);
      if (nextVal !== undefined) {
        Storage.set(`${BUTTON_KEY}-${i}`, nextVal);
      } else {
        Storage.delete(`${BUTTON_KEY}-${i}`);
      }

      const nextLoop = Storage.getBoolean(`${LOOPING_KEY}-${i + 1}`);
      if (nextLoop) {
        Storage.set(`${LOOPING_KEY}-${i}`, true);
      } else {
        Storage.delete(`${LOOPING_KEY}-${i}`);
      }
    }
    Storage.delete(`${BUTTON_KEY}-8`);
    Storage.delete(`${LOOPING_KEY}-8`);
  }

  static removeAll() {
    const keys = Storage.getAllKeys().filter(
      v => v.startsWith(BUTTON_KEY) || v.startsWith(LOOPING_KEY)
    );
    for (const key of keys)
      Storage.delete(key);
    Storage.delete(BUTTON_DELAY_KEY);
    Storage.delete(BYPASS_KEY);
    Storage.delete(CUSTOM_ENABLED_KEY);
    Storage.delete(CUSTOM_SEEDED_KEY);
    this.ensureDefaultsSeeded();
  }

  static getAll() {
    this.ensureDefaultsSeeded();

    const allCustomizations: CustomButtonAction[] = [];
    const keys = Storage.getAllKeys().filter((key) => key.startsWith(BUTTON_KEY));

    for (const key of keys) {
      const storedValue = Storage.getString(key);
      if (!storedValue) continue;

      const numberOfPresses = parseInt(key.split("-")[3]) as Presses;

      // if starts with "<number>_" ==> built-in behavior
      // if contains - ==> custom cmd --> Parse string into CommandOutput
      if (/^\d+_/.test(storedValue)) {
        const splitIdx = storedValue.indexOf("_");
        const strBehavior = storedValue.slice(splitIdx + 1) as ButtonBehaviors;
        if (strBehavior in buttonBehaviorMap) {
          allCustomizations.push({
            behaviorHumanReadable: strBehavior,
            behavior: buttonBehaviorMap[strBehavior],
            looping: false,
            presses: numberOfPresses,
          });
          continue;
        }
      }

      if (storedValue.includes("-")) {
        const parts = storedValue.split("-");
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

        const looping = this.getLooping(numberOfPresses);

        allCustomizations.push({
          presses: numberOfPresses,
          customCommand: customCmd,
          looping,
        });
      }
    }

    return allCustomizations;
  }

  static getAllBy(fn: (press: CustomButtonAction) => boolean) {
    return this.getAll().filter(p => fn(p));
  }

  static getDelay() {
    const value = Storage.getNumber(BUTTON_DELAY_KEY);
    if (value === undefined) return DEFAULT_DELAY;
    else return value;

  }

  static setDelay(delay: number) {
    Storage.set(BUTTON_DELAY_KEY, Math.floor(delay));
  }

}