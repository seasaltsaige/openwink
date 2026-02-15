import { ButtonBehaviors, CommandOutput, Presses } from "../helper/Types";
import { buttonBehaviorMap } from "../helper/Constants";
import Storage from "./Storage";

const CUSTOM_ENABLED_KEY = "oem-button-custom-enabled";
const BUTTON_KEY = "oem-button-values";
const BUTTON_DELAY_KEY = "oem-button-delay";
const BYPASS_KEY = "headlight-bypass";

const DEFAULT_DELAY = 500;

export abstract class CustomOEMButtonStore {
  static isEnabled() {
    const status = Storage.getBoolean(CUSTOM_ENABLED_KEY);
    if (status) return true;
    else return false;
  }

  static enable() {
    Storage.set(CUSTOM_ENABLED_KEY, true);
  }

  static disable() {
    Storage.delete(CUSTOM_ENABLED_KEY);
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
    Storage.delete(`${BUTTON_KEY}-${presses}`);
  }

  static removeAll() {
    const keys = Storage.getAllKeys().filter(v => v.startsWith(BUTTON_KEY));
    for (const key of keys)
      Storage.delete(key);
  }

  static getAll() {

    const allCustomizations: { numberPresses: Presses, behavior: ButtonBehaviors | CommandOutput }[] = [];
    const keys = Storage.getAllKeys().filter((key) => key.startsWith(BUTTON_KEY));

    for (const key of keys) {
      const storedValue = Storage.getString(key);
      if (!storedValue) continue;

      const numberOfPresses = parseInt(key.split("-")[3]) as Presses;

      // if contains _ ==> normal
      // if contains - ==> custom cmd --> Parse string into CommandOutput
      if (storedValue.includes("_")) {
        const [__, strBehavior] = storedValue.split("_").map((v, i) => i === 0 ? parseInt(v) : v) as [Presses, ButtonBehaviors];

        allCustomizations.push({
          behavior: strBehavior,
          numberPresses: numberOfPresses,
        });

      } else if (storedValue.includes("-")) {

        const commandParts = storedValue.split("-");
        const name = commandParts.splice(0, 1)[0];

        const customCmd: CommandOutput = {
          name,
          command: [

          ],
        }

        for (const cmdSection of commandParts) {
          if (cmdSection.startsWith("d"))
            customCmd.command?.push({ delay: parseFloat(cmdSection.slice(1, cmdSection.length)) });
          else
            customCmd.command?.push({ transmitValue: parseInt(cmdSection) });
        }

        allCustomizations.push({
          numberPresses: numberOfPresses,
          behavior: customCmd,
        });
      }
    }

    return allCustomizations;
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