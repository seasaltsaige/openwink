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

  platformPressableView: ViewStyle;
  bottomTabsBackground: ViewStyle;
  bottomTabsPill: ViewStyle;
  bottomTabsPillActive: ViewStyle;
  bottomTabsPillFocusedText: TextStyle;
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
          backgroundColor: themeColors.backgroundPrimaryColor,
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
          color: themeColors.headerTextColor,
          marginRight: 10,
          fontFamily: "SpaceGroteskBold"
        },
        headerText: {
          fontSize: 40,
          color: themeColors.headerTextColor,
          width: "100%",
          fontFamily: "SpaceGroteskBold"
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
          fontSize: 15,
          fontFamily: "SpaceGroteskMedium",
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
          fontFamily: "SpaceGroteskBold",
          fontSize: 19
        },
        mainLongButtonPressableContainer: {
          backgroundColor: themeColors.backgroundSecondaryColor,
          width: "100%",
          padding: 5,
          paddingVertical: 12,
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
          paddingVertical: 12,
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
          fontWeight: "600",
          fontSize: 17,
          fontFamily: "SpaceGroteskMedium",
        },
        mainLongButtonPressableIcon: { marginRight: 10 },
        homeUpdatesButton: {
          backgroundColor: themeColors.backgroundSecondaryColor,
          width: "100%",
          padding: 15,
          paddingVertical: 11,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
        },
        homeUpdatesButtonPressed: {
          backgroundColor: themeColors.buttonColor,
          width: "100%",
          padding: 15,
          paddingVertical: 11,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
        },
        homeUpdatesText: {
          fontSize: 15,
          color: themeColors.textColor,
          fontFamily: "SpaceGroteskMedium",
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
          color: themeColors.headerTextColor,
          fontWeight: "500",
          fontSize: 22,
          fontFamily: "SpaceGroteskMedium",
        },
        backButtonContainerTextPressed: {
          color: themeColors.buttonColor,
          fontWeight: "500",
          fontSize: 22
        },
        backButtonContainerIcon: { marginTop: 4 },
        settingsDropdownContainer: {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          backgroundColor: themeColors.dropdownColor,
          borderRadius: 8,
        },


        modalBackground: {
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        },
        modalSettingsContentContainer: {
          backgroundColor: themeColors.backgroundPrimaryColor,
          width: "70%",
          shadowColor: "black",
          shadowOffset: { height: 2, width: 2 },
          shadowOpacity: 1,
          shadowRadius: 5,
          boxShadow: "black",
          elevation: 2,
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
          textAlign: "center",
          color: themeColors.headerTextColor,
          fontFamily: "SpaceGroteskBold",
        },
        modalSettingsConfirmationText: {
          fontSize: 16,
          textAlign: "center",
          color: themeColors.textColor,
          fontFamily: "SpaceGroteskMedium",
        },
        modalSettingsConfirmationButtonContainer: {
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
        },
        modalSettingsConfirmationButton: {
          backgroundColor: themeColors.backgroundSecondaryColor,
          width: "auto",
          padding: 15,
          paddingVertical: 5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          columnGap: 10,
          justifyContent: "space-evenly",
          borderRadius: 8,
        },
        modalSettingsConfirmationButtonDisabled: {
          backgroundColor: themeColors.disabledButtonColor,
          width: "auto",
          padding: 15,
          paddingVertical: 5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          columnGap: 10,
          borderRadius: 8,
        },
        modalSettingsConfirmationButtonPressed: {
          backgroundColor: themeColors.buttonColor,
          width: "auto",
          padding: 15,
          paddingVertical: 5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          columnGap: 10,
          borderRadius: 8,
        },
        modalSettingsConfirmationButtonText: {
          color: themeColors.buttonTextColor,
          fontSize: 20,
          fontFamily: "SpaceGroteskMedium",
        },
        subSettingHeaderText: {
          fontSize: 25,
          fontFamily: "SpaceGroteskBold",
          color: themeColors.headerTextColor,
          width: "auto",
          marginRight: 10,
        },
        intervalInfoContainer: {
          backgroundColor: themeColors.backgroundPrimaryColor,
          width: "100%",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 20,
        },
        tooltipContainer: {
          backgroundColor: themeColors.backgroundSecondaryColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "auto",
          width: "auto",
          borderRadius: 7
        },
        tooltipContainerText: {
          color: themeColors.textColor,
          textAlign: "center",
          fontFamily: "SpaceGroteskMedium",
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
          color: themeColors.headerTextColor,
          fontFamily: "SpaceGroteskBold",
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
          color: themeColors.headerTextColor,
          fontFamily: "SpaceGrotesk",
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
          backgroundColor: themeColors.buttonColor
        },
        rangeSliderThumbDisabled: {
          width: 25,
          height: 25,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: "white",
          backgroundColor: themeColors.disabledButtonColor,
        },
        rangeSliderRailSelected: {
          height: 5,
          borderRadius: 3,
          backgroundColor: themeColors.buttonColor,
        },
        rangeSliderRailSelectedDisabled: {
          height: 5,
          borderRadius: 3,
          backgroundColor: themeColors.disabledButtonColor,
        },
        rangeSliderRail: {
          flex: 1,
          height: 5,
          borderRadius: 3,
          backgroundColor: themeColors.disabledButtonColor
        },
        rangeSliderSubtextView: {
          width: "85%",
          marginTop: -5,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        rangeSliderSubtext: {
          fontSize: 15,
          fontFamily: "SpaceGroteskMedium",
          color: themeColors.headerTextColor
        },
        rangeSliderButtonsView: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          width: "100%"
        },
        rangeSliderButtons: {
          backgroundColor: themeColors.backgroundSecondaryColor,
          width: "auto",
          paddingVertical: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          paddingHorizontal: 15,
          paddingRight: 10,
          columnGap: 10,
        },
        rangeSliderButtonsPressed: {
          backgroundColor: themeColors.buttonColor,
          width: "auto",
          paddingVertical: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          paddingHorizontal: 15,
          paddingRight: 10,
          columnGap: 10,
        },
        rangeSliderButtonsDisabled: {
          backgroundColor: themeColors.disabledButtonColor,
          width: "auto",
          paddingVertical: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 8,
          paddingHorizontal: 15,
          paddingRight: 10,
          columnGap: 10,
        },
        rangeSliderButtonsText: {
          color: themeColors.buttonTextColor,
          fontSize: 17,
          fontFamily: "SpaceGroteskMedium"
        },
        platformPressableView: {
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        },
        bottomTabsBackground: {
          flexDirection: "row",
          backgroundColor: themeColors.bottomTabsBackground,
          height: 55,
          alignItems: "center",
          justifyContent: "space-around",
        },
        bottomTabsPill: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 7,
          width: 115,
          height: 40,
          borderRadius: 20,
          backgroundColor: themeColors.bottomTabsBackground,
        },
        bottomTabsPillActive: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 7,
          width: 115,
          height: 40,
          borderRadius: 20,
          backgroundColor: themeColors.bottomTabsPill,
        },
        bottomTabsPillFocusedText: {
          color: themeColors.buttonColor,
          fontFamily: "SpaceGroteskBold",
          fontSize: 16,
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