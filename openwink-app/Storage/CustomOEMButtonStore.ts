import { ButtonBehaviors, Presses } from "../helper/Types";
import { buttonBehaviorMap } from "../helper/Constants";
import Storage from "./Storage";

const CUSTOM_ENABLED_KEY = "oem-button-custom-enabled";
const BUTTON_KEY = "oem-button-values";
const BUTTON_DELAY_KEY = "oem-button-delay";

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

  static set(presses: Presses, buttonValue: ButtonBehaviors): void {
    Storage.set(`${BUTTON_KEY}-${presses}`, `${buttonBehaviorMap[buttonValue]}_${buttonValue}`)
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

    const allCustomizations: { numberPresses: Presses, behavior: ButtonBehaviors }[] = [];
    const keys = Storage.getAllKeys().filter((key) => key.startsWith(BUTTON_KEY));

    for (const key of keys) {
      const storedValue = Storage.getString(key);
      if (!storedValue) continue;

      const numberOfPresses = parseInt(key.split("-")[3]) as Presses;

      const [__, strBehavior] = storedValue.split("_").map((v, i) => i === 0 ? parseInt(v) : v) as [Presses, ButtonBehaviors];

      allCustomizations.push({
        behavior: strBehavior,
        numberPresses: numberOfPresses,
      });
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