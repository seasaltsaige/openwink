

// Maps english to actual value
export const buttonBehaviorMap = {
  "Default Behavior": 1,
  "Left Wink": 2,
  "Left Wink x2": 3,
  "Right Wink": 4,
  "Right Wink x2": 5,
  "Both Blink": 6,
  "Both Blink x2": 7,
  "Left Wave": 8,
  "Right Wave": 9,
} as const;

export const buttonBehaviorMapReversed = {
  1: "Default Behavior",
  2: "Left Wink",
  3: "Left Wink x2",
  4: "Right Wink",
  5: "Right Wink x2",
  6: "Both Blink",
  7: "Both Blink x2",
  8: "Left Wave",
  9: "Right Wave",
} as const;

export type ButtonBehaviors = "Default Behavior" | "Left Wink" | "Left Wink x2" | "Right Wink" | "Right Wink x2" | "Both Blink" | "Both Blink x2" | "Left Wave" | "Right Wave";
export type Presses = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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