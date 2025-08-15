

const key = "SLEEPY_KEY";

export abstract class SleepyEyeStore {
  static async set(side: "left" | "right", value: number) {
    if (value < 0 || value > 100) return null;
    try {
      await AsyncStorage.setItem(`${key}_${side}`, value.toString());
    } catch (err) {
      return null;
    }
  }


  static async get(side: "left" | "right") {
    try {
      const stored = await AsyncStorage.getItem(`${key}_${side}`);
      if (!stored) return 50;
      else return parseInt(stored);
    } catch (err) {
      return null;
    }
  }

  static async reset(side: "left" | "right" | "both") {
    try {
      if (side === "both") {
        const keys = (await AsyncStorage.getAllKeys()).filter(v => v.startsWith(key));
        await AsyncStorage.multiRemove(keys);
      } else await AsyncStorage.removeItem(`${key}_${side}`);
    } catch (err) {
      return null;
    }
  }
}