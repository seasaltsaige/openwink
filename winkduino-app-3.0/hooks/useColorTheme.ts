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

  }

  async function revertTheme(theme: keyof typeof colorThemeDefaults) {

  }

  async function revertAllThemes() {

  }
}