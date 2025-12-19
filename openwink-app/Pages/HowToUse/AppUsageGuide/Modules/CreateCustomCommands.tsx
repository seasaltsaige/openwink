import { Text } from "react-native";
import { CreateCustomCommandButtonSVG, CreateCustomCommandMainSVG, CreateCustomCommandToolbarSVG } from "../../../../Components/SVG";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function CreateCustomCommands() {
  const { colorTheme } = useColorTheme();

  return (
    <AccordionDropdown
      key={"custom_creation"}
      headerText="Creating Custom Commands"
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
            Custom Commands allow you to save a desired sequence of default commands, enabling execution of a preferred sequence in one button press.
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            To get started creating a custom command, navigate to the page "Create Custom Commands".
          </Text>
          <CreateCustomCommandButtonSVG />

          <CreateCustomCommandMainSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            1. Command name input.{"\n\n"}
            2. Add command components, customizing your preferred sequence.{"\n\n"}
            3. Components are default commands, which can be edited or reordered, using the drag bars.{"\n\n"}
          </Text>

          <CreateCustomCommandToolbarSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            {/* Am i stupid? this is just wrong lmao */}
            1. Save your command once you have created your desired sequence.{"\n\n"}
            2. If you make a mistake, you can undo changes.{"\n\n"}
            3. If you change your mind, you are able to cancel using the discard button.
          </Text>
        </>
      }
    />
  )
}