import { ButtonBehaviors, Presses } from "../helper/Types";
import { buttonBehaviorMap } from "../helper/Constants";

const CUSTOM_ENABLED_KEY = "oem-button-custom-enabled";
const BUTTON_KEY = "oem-button-values";
const BUTTON_DELAY_KEY = "oem-button-delay";

const DEFAULT_DELAY = 500;

export abstract class CustomOEMButtonStore {
  static async isEnabled() {
    const status = await AsyncStorage.getItem(CUSTOM_ENABLED_KEY);
    if (status === "1") return true;
    else return false;
  }

  static async enable() {
    try {
      await AsyncStorage.setItem(CUSTOM_ENABLED_KEY, "1")
    } catch (err) {
      return null;
    }
  }

  static async disable() {
    try {
      await AsyncStorage.removeItem(CUSTOM_ENABLED_KEY);
    } catch (err) {
      return null;
    }
  }

  static async set(presses: Presses, buttonValue: ButtonBehaviors): Promise<void | null> {
    try {
      await AsyncStorage.setItem(`${BUTTON_KEY}-${presses}`, `${buttonBehaviorMap[buttonValue]}_${buttonValue}`)
    } catch (err) {
      return null;
    }
  }

  static async remove(presses: Presses): Promise<void | null> {
    try {
      await AsyncStorage.removeItem(`${BUTTON_KEY}-${presses}`);
    } catch (err) {
      return null;
    }
  }

  static async removeAll() {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter(v => v.startsWith(BUTTON_KEY));
      await AsyncStorage.multiRemove(keys);
    } catch (err) {
      return null;
    }
  }

  static async getAll() {
    try {
      const allCustomizations: { numberPresses: Presses, behavior: ButtonBehaviors }[] = [];
      const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(BUTTON_KEY));

      for (const key of keys) {
        const storedValue = await AsyncStorage.getItem(key);
        if (!storedValue) continue;

        const numberOfPresses = parseInt(key.split("-")[3]) as Presses;

        const [__, strBehavior] = storedValue.split("_").map((v, i) => i === 0 ? parseInt(v) : v) as [Presses, ButtonBehaviors];

        allCustomizations.push({
          behavior: strBehavior,
          numberPresses: numberOfPresses,
        });
      }

      return allCustomizations;

    } catch (err) {
      return null;
    }
  }

  static async getDelay() {
    try {
      const value = await AsyncStorage.getItem(BUTTON_DELAY_KEY);
      if (value === null) return DEFAULT_DELAY;
      else return parseInt(value);
    } catch (err) {
      return null;
    }
  }

  static async setDelay(delay: number) {
    try {
      await AsyncStorage.setItem(BUTTON_DELAY_KEY, Math.floor(delay).toString());
    } catch (err) {
      return null;
    }
  }

}