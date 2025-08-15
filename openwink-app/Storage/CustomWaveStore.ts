import AsyncStorage from "@react-native-async-storage/async-storage";
const key = "HEADLIGHT_MULTI";
export abstract class CustomWaveStore {

  static async setMultiplier(multiplier: number) {
    if (multiplier < 0 || multiplier > 1) return null;
    try {
      await AsyncStorage.setItem(key, multiplier.toString());
    } catch (err) {
      return null;
    }
  }

  static async getMultiplier() {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored)
        return parseFloat(stored);
      else return 1;
    } catch (err) {
      return null;
    }
  }

  static async reset() {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      return null;
    }
  }

}