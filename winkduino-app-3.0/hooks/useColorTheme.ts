import { useEffect, useState } from "react";
import { ThemeStore } from "../Storage";
import { ColorTheme } from "../helper/Constants";

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState(ColorTheme.colorThemeDefaults);

  useEffect(() => {
    return () => { };
  }, []);

  async function update() {
    const theme = await ThemeStore.getStoredTheme();
    setColorTheme((prev) => ({ ...prev, theme }));
  }

  async function setTheme(theme: keyof typeof ColorTheme.colorThemeDefaults, color: string) {
    await ThemeStore.setTheme(theme, color);
    setColorTheme((prev) => ({ ...prev, [theme]: color }));
  }

  async function revertTheme(theme: keyof typeof ColorTheme.colorThemeDefaults) {
    await ThemeStore.resetThemeColor(theme);
    setColorTheme((prev) => ({ ...prev, [theme]: ColorTheme.colorThemeDefaults[theme] }));
  }

  async function revertAllThemes() {
    await ThemeStore.resetAllThemeColors();
    setColorTheme((_) => ({ ...ColorTheme.colorThemeDefaults }));
  }

  return {
    colorTheme,
    revertAllThemes,
    revertTheme,
    setTheme,
    update,
  }
}