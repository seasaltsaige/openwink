import { createContext, useEffect, useMemo, useState } from "react";
import { ColorTheme, ThemeColors } from "../helper/Constants";
import { ThemeStore } from "../Storage";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";



// TODO

interface StyleSheetInterface extends StyleSheet.NamedStyles<any> {
  container: ViewStyle;
  moduleSettingsContainer: ViewStyle;
  headerContainer: ViewStyle;
  settingsHeaderText: TextStyle;
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
  homeUpdatesButton: ViewStyle;
  homeUpdatesButtonPressed: ViewStyle;
  homeUpdatesText: TextStyle;

  backButtonContainer: ViewStyle;
  backButtonContainerText: TextStyle;
  backButtonContainerTextPressed: TextStyle;
  backButtonContainerIcon: ViewStyle;

  settingsDropdownContainer: ViewStyle;

  modalBackground: ViewStyle;
  modalSettingsContentContainer: ViewStyle;
  modalSettingsConfirmationHeader: TextStyle;
  modalSettingsConfirmationText: TextStyle;

  modalSettingsConfirmationButtonContainer: ViewStyle;
  modalSettingsConfirmationButton: ViewStyle;
  modalSettingsConfirmationButtonPressed: ViewStyle;
  modalSettingsConfirmationButtonDisabled: ViewStyle;
  modalSettingsConfirmationButtonText: TextStyle;

  subSettingHeaderText: TextStyle;

  intervalInfoContainer: ViewStyle;
  tooltipContainer: ViewStyle;
  tooltipContainerText: TextStyle;
  tooltipContainerView: ViewStyle;
  tooltipText: TextStyle;

  rangeSliderContainer: ViewStyle;
  rangeSliderStyle: ViewStyle;
  rangeSliderLowText: TextStyle;
  rangeSliderThumb: ViewStyle;
  rangeSliderThumbDisabled: ViewStyle;
  rangeSliderRailSelected: ViewStyle;
  rangeSliderRailSelectedDisabled: ViewStyle;
  rangeSliderRail: ViewStyle;
  rangeSliderSubtextView: ViewStyle;
  rangeSliderSubtext: TextStyle;
  rangeSliderButtonsView: ViewStyle;
  rangeSliderButtons: ViewStyle;
  rangeSliderButtonsPressed: ViewStyle;
  rangeSliderButtonsDisabled: ViewStyle;
  rangeSliderButtonsText: TextStyle;
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

    setTheme_(
      StyleSheet.create<StyleSheetInterface>({
        container: {
          backgroundColor: themeColors.backgroundPrimaryColor,
          height: "100%",
          padding: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: 18,
        },
        moduleSettingsContainer: {
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
          padding: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: 40,
        },
        headerContainer: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        },
        settingsHeaderText: {
          fontSize: 30,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          marginRight: 10,
        },
        headerText: {
          fontSize: 40,
          fontWeight: 900,
          color: themeColors.headerTextColor,
          width: "100%",
          fontFamily: 'SpaceGrotesk',
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
        homeUpdatesButton: {
          backgroundColor: colorTheme.backgroundSecondaryColor,
          width: "100%",
          padding: 15,
          paddingVertical: 13,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
        },
        homeUpdatesButtonPressed: {
          backgroundColor: colorTheme.buttonColor,
          width: "100%",
          padding: 15,
          paddingVertical: 13,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
        },
        homeUpdatesText: {
          fontSize: 15,
          color: colorTheme.textColor,
          fontWeight: "600",
        },
        backButtonContainer: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 10,
          height: "100%"
        },
        backButtonContainerText: {
          color: colorTheme.headerTextColor,
          fontWeight: "500",
          fontSize: 22
        },
        backButtonContainerTextPressed: {
          color: colorTheme.buttonColor,
          fontWeight: "500",
          fontSize: 22
        },
        backButtonContainerIcon: { marginTop: 3 },
        settingsDropdownContainer: {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          backgroundColor: colorTheme.dropdownColor,
          borderRadius: 8,
        },


        modalBackground: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        },
        modalSettingsContentContainer: {
          backgroundColor: colorTheme.backgroundPrimaryColor,
          width: "70%",
          shadowColor: "black",
          shadowOffset: { height: 2, width: 2 },
          shadowOpacity: 1,
          shadowRadius: 5,
          boxShadow: "black",
          elevation: 10,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          padding: 15,
        },
        modalSettingsConfirmationHeader: {
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          color: colorTheme.headerTextColor
        },
        modalSettingsConfirmationText: {
          fontSize: 16,
          textAlign: "center",
          fontWeight: "400",
          color: colorTheme.textColor,
        },
        modalSettingsConfirmationButtonContainer: {
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly"
        },
        modalSettingsConfirmationButton: {
          backgroundColor: colorTheme.backgroundSecondaryColor,
          width: "40%",
          padding: 5,
          paddingVertical: 8,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          borderRadius: 8,
        },
        modalSettingsConfirmationButtonDisabled: {
          backgroundColor: colorTheme.disabledButtonColor,
          width: "40%",
          padding: 5,
          paddingVertical: 8,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          borderRadius: 8,
        },
        modalSettingsConfirmationButtonPressed: {
          backgroundColor: colorTheme.buttonColor,
          width: "40%",
          padding: 5,
          paddingVertical: 8,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          borderRadius: 8,
        },
        modalSettingsConfirmationButtonText: {
          color: colorTheme.buttonTextColor,
          fontSize: 20,
          fontWeight: 500,
        },
        subSettingHeaderText: {
          fontSize: 25,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        },
        intervalInfoContainer: {
          backgroundColor: colorTheme.backgroundPrimaryColor,
          width: "100%",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 20,
        },
        tooltipContainer: {
          backgroundColor: colorTheme.backgroundSecondaryColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "auto",
          width: "auto",
          borderRadius: 7
        },
        tooltipContainerText: {
          color: colorTheme.textColor,
          textAlign: "center",
          fontWeight: "500",
          padding: 5,
        },
        tooltipContainerView: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          columnGap: 10,
        },
        tooltipText: {
          color: colorTheme.headerTextColor,
          fontWeight: "600",
          fontSize: 22,
        },
        rangeSliderContainer: {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
          rowGap: 10,
        },
        rangeSliderStyle: {
          width: "80%",
          height: 10,
          marginTop: 10
        },
        rangeSliderLowText: {
          color: colorTheme.headerTextColor,
          fontWeight: "bold",
          fontSize: 15,
          textAlign: "center",
          marginLeft: -15,
          width: "auto",
        },
        rangeSliderThumb: {
          width: 25,
          height: 25,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: "white",
          backgroundColor: colorTheme.buttonColor
        },
        rangeSliderThumbDisabled: {
          width: 25,
          height: 25,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: "white",
          backgroundColor: colorTheme.disabledButtonColor,
        },
        rangeSliderRailSelected: {
          height: 5,
          borderRadius: 3,
          backgroundColor: colorTheme.buttonColor,
        },
        rangeSliderRailSelectedDisabled: {
          height: 5,
          borderRadius: 3,
          backgroundColor: colorTheme.disabledButtonColor,
        },
        rangeSliderRail: {
          flex: 1,
          height: 5,
          borderRadius: 3,
          backgroundColor: colorTheme.disabledButtonColor
        },
        rangeSliderSubtextView: {
          width: "85%",
          marginTop: -5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        },
        rangeSliderSubtext: {
          fontSize: 15,
          fontWeight: "bold",
          color: colorTheme.headerTextColor
        },
        rangeSliderButtonsView: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          width: "100%"
        },
        rangeSliderButtons: {
          backgroundColor: colorTheme.backgroundSecondaryColor,
          width: "40%",
          padding: 5,
          paddingVertical: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          paddingHorizontal: 15,
          paddingRight: 10
        },
        rangeSliderButtonsPressed: {
          backgroundColor: colorTheme.buttonColor,
          width: "40%",
          padding: 5,
          paddingVertical: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          paddingHorizontal: 15,
          paddingRight: 10
        },
        rangeSliderButtonsDisabled: {
          backgroundColor: colorTheme.disabledButtonColor,
          width: "40%",
          padding: 5,
          paddingVertical: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          paddingHorizontal: 15,
          paddingRight: 10
        },
        rangeSliderButtonsText: {
          color: colorTheme.buttonTextColor,
          fontSize: 17,
          fontWeight: 500,
        }
      })
    );
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