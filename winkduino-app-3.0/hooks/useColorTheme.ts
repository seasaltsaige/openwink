import { useEffect, useState } from "react";
import { ThemeStore } from "../Storage";
import { colorThemeDefaults } from "../helper/Constants";

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState(colorThemeDefaults);

  useEffect(() => {
    return () => { };
  }, []);

  async function update() {
    const theme = await ThemeStore.getStoredTheme();
    setColorTheme((prev) => ({ ...prev, theme }));
  }

  async function setTheme(theme: keyof typeof colorThemeDefaults, color: string) {
    await ThemeStore.setTheme(theme, color);
    setColorTheme((prev) => ({ ...prev, [theme]: color }));
  }

  async function revertTheme(theme: keyof typeof colorThemeDefaults) {
    await ThemeStore.resetThemeColor(theme);
    setColorTheme((prev) => ({ ...prev, [theme]: colorThemeDefaults[theme] }));
  }

  async function revertAllThemes() {
    await ThemeStore.resetAllThemeColors();
    setColorTheme((_) => ({ ...colorThemeDefaults }));
  }

  return {
    colorTheme,
    revertAllThemes,
    revertTheme,
    setTheme,
    update,
  }
}