import { useContext } from "react";
import { ThemeContext } from "../Providers/ThemeProvider";
export function useColorTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useColorTheme must be inside a ThemeProvider");
  }
  return ctx;
}


