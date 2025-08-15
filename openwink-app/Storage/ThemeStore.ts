
import { ColorTheme } from "../helper/Constants";

export abstract class ThemeStore {

  static async setTheme(key: keyof typeof ColorTheme.themeNames) {
    try {
      await AsyncStorage.setItem("color-theme", key);
    } catch (err) {
      console.log(err);
    }
  }

  static async getStoredTheme() {

    try {
      const themeName: keyof typeof ColorTheme.themeNames = await AsyncStorage.getItem("color-theme") as any;
      return themeName;
    } catch (err) {
      console.log(err);
    }

  }

  static async reset() {
    try {
      await AsyncStorage.removeItem(`color-theme`);
    } catch (err) {
      console.log(err);
    }

  }

}