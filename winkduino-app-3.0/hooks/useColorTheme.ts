import { useEffect, useState } from "react";
import { ThemeStore } from "../Storage";
import { ColorTheme } from "../helper/Constants";

const defaultName: keyof typeof ColorTheme.themeNames = "brilliantBlack";

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState(ColorTheme[defaultName]);
  const [themeName, setThemeName] = useState(defaultName);

  useEffect(() => {
    (async () => {
      await update();
    })();

    return () => { };
  }, []);

  async function update() {
    const theme = await ThemeStore.getStoredTheme();
    if (theme) {
      setColorTheme(ColorTheme[theme]);
      setThemeName(theme);
    }
  }

  async function setTheme(theme: keyof typeof ColorTheme.themeNames) {
    await ThemeStore.setTheme(theme);
    setColorTheme(ColorTheme[theme]);
    setThemeName(theme);
  }

  async function reset() {
    await ThemeStore.reset();
    setColorTheme(ColorTheme[defaultName]);
    setThemeName(defaultName);
  }

  return {
    colorTheme,
    themeName,
    reset,
    setTheme,
    update,
  }
}