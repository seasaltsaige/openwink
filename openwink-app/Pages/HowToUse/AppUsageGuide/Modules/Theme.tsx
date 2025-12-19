import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";
import { AppThemeSVG } from "../../../../Components/SVG";

export function Theme() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"theme"}
      headerText="App Theme"
      dropdown={
        <>
          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Navigate to the Settings page, then press on the button labeled "Application Theme" as shown.
          </Text>

          <AppThemeSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            This will take you to a page as shown which allows you to choose from six predefined themes, all stemming from the NA Miata color schemes. Crystal White is the apps one light theme, and the rest are variations of the dark theme.
          </Text>

        </>
      }
    />
  )
}