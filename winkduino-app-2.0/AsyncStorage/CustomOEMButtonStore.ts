import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 -1 : Unset
  1 : Default (If UP, switch to DOWN; if DOWN, switch to UP)
  2 : Left Blink
  3 : Left Blink x2
  4 : Right Blink
  5 : Right Blink x2
  6 : Both Blink
  7 : Both Blink x2
  8 : Left Wave
  9 : Right Wave
 10 : ...
**/

// Maps english to actual value
export const buttonBehaviorMap = {
  "Default Behavior": 1,
  "Left Blink": 2,
  "Left Blink x2": 3,
  "Right Blink": 4,
  "Right Blink x2": 5,
  "Both Blink": 6,
  "Both Blink x2": 7,
  "Left Wave": 8,
  "Right Wave": 9,
}

export const buttonBehaviorMapReversed = {
  1: "Default Behavior",
  2: "Left Blink",
  3: "Left Blink x2",
  4: "Right Blink",
  5: "Right Blink x2",
  6: "Both Blink",
  7: "Both Blink x2",
  8: "Left Wave",
  9: "Right Wave",
}

export type ButtonBehaviors = "Default Behavior" | "Left Blink" | "Left Blink x2" | "Right Blink" | "Right Blink x2" | "Both Blink" | "Both Blink x2" | "Left Wave" | "Right Wave";

const BUTTON_KEY = "oem-button-values";
const BUTTON_DELAY_KEY = "oem-button-delay";
const DEFAULT_DELAY = 500;

// This should only be called AFTER esp side is updated
export class CustomOEMButtonStore {

  static async set(presses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, buttonVal: ButtonBehaviors) {
    try {
      await AsyncStorage.setItem(`${BUTTON_KEY}-${presses}`, `${buttonBehaviorMap[buttonVal]}_${buttonVal}`);
    } catch (err) {
      console.log(err);
    }
  }

  static async remove(presses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) {
    try {
      await AsyncStorage.removeItem(`${BUTTON_KEY}-${presses}`);
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const all: { numberPresses: number, behavior: ButtonBehaviors }[] = [];
      const allKeys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(BUTTON_KEY));
      for (const key of allKeys) {
        const stored = await AsyncStorage.getItem(key);
        const numPresses = key.split("-")[3];
        const [intBehavior, strBehavior] = stored?.split("_") as [string, string];
        all.push({ behavior: strBehavior as ButtonBehaviors, numberPresses: parseInt(numPresses) });
      }
      return all;
    } catch (err) {
      console.log(err);
    }
  }

  static async getDelay() {
    try {
      const value = await AsyncStorage.getItem(BUTTON_DELAY_KEY);
      if (value === null) return DEFAULT_DELAY;
      else return parseInt(value);
    } catch (err) {
      console.log(err);
    }
  }

  static async setDelay(delay: number) {
    try {
      await AsyncStorage.setItem(BUTTON_DELAY_KEY, Math.floor(delay).toString());
    } catch (err) {
      console.log(err);
    }
  }
}