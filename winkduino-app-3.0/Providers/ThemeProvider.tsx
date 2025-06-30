import { createContext, useEffect, useMemo, useState } from "react";
import { ColorTheme, ThemeColors } from "../helper/Constants";
import { ThemeStore } from "../Storage";
import { StyleSheet, TextStyle, View, ViewStyle } from "react-native";



// TODO

interface StyleSheetInterface extends StyleSheet.NamedStyles<any> {
  container: ViewStyle;
  headerContainer: ViewStyle;
  headerText: TextStyle;
  contentContainer: ViewStyle;
  homeScreenConnectionButton: ViewStyle;
  homeScreenConnectionButtonPressed: ViewStyle;
  homeScreenConnectionButtonText: TextStyle;
  homeScreenButtonsContainer: ViewStyle;
  labelHeader: TextStyle;
  mainLongButtonPressableContainer: ViewStyle;
  mainLongButtonPressableContainerPressed: ViewStyle;
  mainLongButtonPressableView: ViewStyle;
  mainLongButtonPressableText: TextStyle;
  mainLongButtonPressableIcon: ViewStyle;
}

export type ThemeContextType = {
  update: (name: keyof typeof ColorTheme.themeNames) => void;
  setTheme: (theme: keyof typeof ColorTheme.themeNames) => Promise<void>;
  reset: () => Promise<void>;
  theme: StyleSheet.NamedStyles<StyleSheetInterface>;
  colorTheme: ThemeColors;
  themeName: keyof typeof ColorTheme.themeNames;
};

const defaultName: keyof typeof ColorTheme.themeNames = "brilliantBlack";

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme_] = useState({} as StyleSheet.NamedStyles<StyleSheetInterface>);
  const [colorTheme, setColorTheme] = useState(ColorTheme[defaultName]);

  const [themeName, setThemeName] = useState<keyof typeof ColorTheme.themeNames>(defaultName);

  useEffect(() => {
    update(themeName);
    return () => { };
  }, []);

  function update(name: keyof typeof ColorTheme.themeNames) {
    const themeColors = ColorTheme[name];
    setColorTheme(ColorTheme[name]);
    setThemeName(name);

    setTheme_(StyleSheet.create<StyleSheetInterface>({
      container: {
        backgroundColor: themeColors.backgroundPrimaryColor,
        height: "100%",
        padding: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        rowGap: 18,
      },
      headerContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      },
      headerText: {
        fontSize: 40,
        fontWeight: "bold",
        color: themeColors.headerTextColor,
        width: "100%",
      },
      contentContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 30,
        width: "100%",
      },
      homeScreenConnectionButton: {
        backgroundColor: themeColors.backgroundSecondaryColor,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        paddingVertical: 12,
        borderRadius: 7,
        width: "60%"
      },
      homeScreenConnectionButtonPressed: {
        backgroundColor: themeColors.buttonColor,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        paddingVertical: 12,
        borderRadius: 7,
        width: "60%"
      },
      homeScreenConnectionButtonText: {
        color: themeColors.headerTextColor,
        fontWeight: "bold",
        fontSize: 15,
      },
      homeScreenButtonsContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        rowGap: 13,
      },
      labelHeader: {
        alignSelf: "flex-start",
        textAlign: "left",
        color: themeColors.headerTextColor,
        fontWeight: "500",
        fontSize: 20
      },
      mainLongButtonPressableContainer: {
        backgroundColor: themeColors.backgroundSecondaryColor,
        width: "100%",
        padding: 5,
        paddingVertical: 13,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 8,
      },
      mainLongButtonPressableContainerPressed: {
        backgroundColor: themeColors.buttonColor,
        width: "100%",
        padding: 5,
        paddingVertical: 13,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 8,
      },
      mainLongButtonPressableView: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 10,
        marginLeft: 10,
      },
      mainLongButtonPressableText: {
        color: themeColors.headerTextColor,
        fontWeight: "bold",
        fontSize: 17,
      },
      mainLongButtonPressableIcon: { marginRight: 10 },

    }))
  }

  async function setTheme(theme: keyof typeof ColorTheme.themeNames) {
    update(theme);
    await ThemeStore.setTheme(theme);
  }

  async function reset() {
    update(defaultName);
    await ThemeStore.reset();
  }

  const value: ThemeContextType = useMemo(() => ({
    colorTheme,
    themeName,
    theme,
    reset,
    setTheme,
    update,
  }), [
    colorTheme,
    theme,
    themeName,
  ]);


  return <ThemeContext.Provider value={value}>
    {children}
  </ThemeContext.Provider>

}