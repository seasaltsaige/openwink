import { useEffect, useState } from "react";
import { ThemeStore } from "../AsyncStorage/ThemeStore";


export const defaults = {
  backgroundPrimaryColor: "#141414",
  backgroundSecondaryColor: "#1e1e1e",
  buttonColor: "#800020",
  disabledButtonColor: "#878787",
  buttonTextColor: "#ffffff",
  disabledButtonTextColor: "#ffffff",
  headerTextColor: "#ffffff",
  textColor: "#ffffff",
}


export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState(defaults);

  useEffect(() => {
    (async () => {
      await update();
    })();
  }, []);

  async function update() {
    const storedTheme = await ThemeStore.getStoredTheme();
    const toSet = {};
    for (const key in storedTheme) {
      //@ts-ignore
      toSet[key] = storedTheme[key];
    }
    setColorTheme((prev) => ({ ...prev, ...toSet }));
  }

  async function setTheme(theme: keyof typeof defaults, color: string) {
    await ThemeStore.setTheme(theme, color);
    setColorTheme((prev) => ({ ...prev, [theme]: color }));
  }

  async function revertDefaults() {
    await ThemeStore.resetAllThemes();
    setColorTheme(defaults);
  }

  async function resetTheme(theme: keyof typeof defaults) {
    await ThemeStore.resetTheme(theme);
    setColorTheme((prev) => ({ ...prev, [theme]: defaults[theme] }));
  }


  return {
    colorTheme,
    revertDefaults,
    setTheme,
    resetTheme,
    update
  }
}