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

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            In the following page, in section 1, you are able to give your command a memorable name, followed by section 2, which allows you to add components to the command. Components are default commands, which can be edited or reordered in section 3, using the drag bars.
          </Text>

          <CreateCustomCommandMainSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Finally, using the toolbar visible at the bottom of the page, you can save your command once you are happy with the actions by pressing the icon labeled 1. If you make a mistake, you can undo your changes with the icon labeled 2. If you decide to, you are able to cancel using the discard button labeled 3.
          </Text>

          <CreateCustomCommandToolbarSVG />

        </>
      }
    />
  )
}