import { createContext, useEffect, useMemo, useState } from "react";
import { ColorTheme, Theme } from "../helper/Constants";
import { ThemeStore } from "../Storage";

export type ThemeContextType = {
  update: () => Promise<void>;
  setTheme: (theme: keyof typeof ColorTheme.themeNames) => Promise<void>;
  reset: () => Promise<void>;
  colorTheme: Theme;
  themeName: keyof typeof ColorTheme.themeNames;
};


const defaultName: keyof typeof ColorTheme.themeNames = "brilliantBlack";

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorTheme, setColorTheme] = useState(ColorTheme[defaultName]);
  const [themeName, setThemeName] = useState<keyof typeof ColorTheme.themeNames>(defaultName);

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

  const value: ThemeContextType = useMemo(() => ({
    colorTheme,
    themeName,
    reset,
    setTheme,
    update,
  }), [
    colorTheme,
    themeName,
  ]);


  return <ThemeContext.Provider value={value}>
    {children}
  </ThemeContext.Provider>

}