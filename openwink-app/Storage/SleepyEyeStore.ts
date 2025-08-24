import Storage from "./Storage";
const key = "SLEEPY_KEY";

export abstract class SleepyEyeStore {
  static set(side: "left" | "right", value: number) {
    if (value < 0 || value > 100) return null;
    Storage.set(`${key}_${side}`, value);
  }


  static get(side: "left" | "right") {

    const stored = Storage.getNumber(`${key}_${side}`);
    if (!stored) return 50;
    else return stored;
  }

  static reset(side: "left" | "right" | "both") {
    if (side === "both") {
      const keys = Storage.getAllKeys().filter(v => v.startsWith(key));
      for (const key of keys)
        Storage.delete(key);
    } else Storage.delete(`${key}_${side}`);
  }
}