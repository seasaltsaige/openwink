import { Text, View } from "react-native";
import { DefaultCommandsButtonSVG, DefaultCommandsSVG } from "../../../../Components/SVG";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function DefaultCommands() {
  const { colorTheme } = useColorTheme();

  return (
    <AccordionDropdown
      key={"default"}
      headerText="Sending a Command"
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
            To send a wink command to the Module, once connected, navigate to the "Default Commands" page.
          </Text>
          <DefaultCommandsButtonSVG />
          <DefaultCommandsSVG />
          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Choose from the listed commands, and press on one to execute it.
            The state of the headlights will update automatically as they move.
          </Text>

          <View
            style={{
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-start",
              rowGap: 5,
            }}
          >
            <Text
              style={{
                color: `${colorTheme.headerTextColor}99`,
                fontFamily: "IBMPlexSans_400Regular",
                width: "90%",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {"    "}• A "Wink" will move the corresponding headlight(s) to the opposite position, then back again.
            </Text>
            <Text
              style={{
                color: `${colorTheme.headerTextColor}99`,
                fontFamily: "IBMPlexSans_400Regular",
                width: "90%",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {"    "}• A "Wave" will move the starting headlight, wait a designated delay, then move the opposite headlight, then finally return to original positioning in sequence.
            </Text>
            <Text
              style={{
                color: `${colorTheme.headerTextColor}99`,
                fontFamily: "IBMPlexSans_400Regular",
                width: "90%",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {"    "}• "Sleepy Eye" will move the headlights up a designated percentage of the total movement.
            </Text>
          </View>
        </>
      }
    />

  )
}