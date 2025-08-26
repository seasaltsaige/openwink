import Storage from "./Storage";
const key = "HEADLIGHT_MULTI";
export abstract class CustomWaveStore {

  static setMultiplier(multiplier: number): void {
    if (multiplier < 0 || multiplier > 1) return;
    Storage.set(key, multiplier);
  }

  static getMultiplier() {
    const stored = Storage.getNumber(key);
    if (stored)
      return stored;
    else return 1;
  }

  static reset() {
    Storage.delete(key);
  }

}