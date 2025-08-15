import Storage from ".";
import { ColorTheme } from "../helper/Constants";

export abstract class ThemeStore {

  static setTheme(key: keyof typeof ColorTheme.themeNames) {
    Storage.set("color-theme", key);
  }

  static getStoredTheme() {
    const themeName: keyof typeof ColorTheme.themeNames = Storage.getString("color-theme") as any;
    return themeName;
  }

  static reset() {
    Storage.delete("color-theme");
  }
}