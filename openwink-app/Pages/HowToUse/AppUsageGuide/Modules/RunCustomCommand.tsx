import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";
import { CustomCommandSequenceSVG, RunCustomCommandButtonSVG, RunCustomCommandSVG } from "../../../../Components/SVG";

export function RunCustomCommand() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"custom_execution"}
      headerText="Running Custom Commands"
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
            To run your newly created custom command, navigate to the page labeled "Custom Commands".
          </Text>

          <RunCustomCommandButtonSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            On this page, you will find your newly created command, and any other existing commands preset. To run the command, ensure you are connected to your wink module, then simply press on the play button. To stop a command early, press the new pause button.
          </Text>

          <RunCustomCommandSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Additionally, if you forget which command is which, press on the eye icon to view a quick reference of what the command contains.
          </Text>

          <CustomCommandSequenceSVG />

        </>
      }
    />
  )
}