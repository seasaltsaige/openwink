import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorTheme, Theme } from "../helper/Constants";

export abstract class ThemeStore {
  static async setTheme(key: keyof Theme, color: string) {
    try {
      await AsyncStorage.setItem(`color-theme-${key}`, color);
    } catch (err) {
      console.log(err);
    }
  }

  static async getStoredTheme() {
    const theme: Partial<Theme> = {};

    for (const key in ColorTheme.colorThemeDefaults) {
      try {
        const storedValue = await AsyncStorage.getItem(`color-theme-${key}`);
        if (storedValue === null) continue;
        //@ts-ignore
        else theme[key] = storedValue;
      } catch (err) {
        console.log(err, key);
      }
    }

    return theme;
  }

  static async resetAllThemeColors() {
    for (const key in ColorTheme.colorThemeDefaults) {
      try {
        await AsyncStorage.removeItem(`color-theme-${key}`);
      } catch (err) {
        console.log(err, key);
      }
    }
  }

  static async resetThemeColor(theme: keyof Theme) {
    try {
      await AsyncStorage.removeItem(`color-theme-${theme}`);
    } catch (err) {
      console.log(err, theme);
    }
  }

}