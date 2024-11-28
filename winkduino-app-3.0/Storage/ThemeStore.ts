import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorThemeDefaults } from "../helper/Constants";

export abstract class ThemeStore {
  static async setTheme(key: keyof typeof colorThemeDefaults, color: string) {
    try {
      await AsyncStorage.setItem(`color-theme-${key}`, color);
    } catch (err) {
      console.log(err);
    }
  }

  static async getStoredTheme() {
    const theme: Partial<typeof colorThemeDefaults> = {};

    for (const key in colorThemeDefaults) {
      try {
        const storedValue = await AsyncStorage.getItem(`color-theme-${key}`);
        if (storedValue === null) continue;
        else theme[key as keyof typeof colorThemeDefaults] = storedValue;
      } catch (err) {
        console.log(err, key);
      }
    }

    return theme;
  }

  static async resetAllThemeColors() {
    for (const key in colorThemeDefaults) {
      try {
        await AsyncStorage.removeItem(`color-theme-${key}`);
      } catch (err) {
        console.log(err, key);
      }
    }
  }

  static async resetThemeColor(theme: keyof typeof colorThemeDefaults) {
    try {
      await AsyncStorage.removeItem(`color-theme-${theme}`);
    } catch (err) {
      console.log(err, theme);
    }
  }

}