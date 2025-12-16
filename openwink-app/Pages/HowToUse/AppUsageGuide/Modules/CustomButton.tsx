import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { ButtonActionsListSVG, CustomButtonActionPanelSVG, CustomButtonAndBypassSVG, EditPressIntervalSVG } from "../../../../Components/SVG";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function CustomButton() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"button"}
      headerText="Custom Retractor Button"
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
            The Custom Retractor Button settings allow you to customize the behaviors of the OEM Retractor Button located on the Dash of the car.
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
            To change these settings, navigate to "Settings" → "Module Settings" → "Customize Button Actions".{"\n"}
            {"    "}Customizations can be enabled or disabled, allowing for OEM behavior of the retractor button, and disabling all customization logic, except for reset sequences.{"\n"}
            {"    "}Headlight bypass allows for use of Button Customizations while the cars headlight lights are turned on. While enabled, all actions return to the "Up" position for safety reasons. This should not be used at night.
          </Text>

          <CustomButtonAndBypassSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Press Interval adjusts the maximum length between button presses, before an action is executed. Lower delays mean a more responsive button when the sequence is finished, but must be executed faster. A higher delay means it is easier to execute, but has a higher execution lag when finished. A middle ground of ~400 to 500ms is recommended.
          </Text>

          <EditPressIntervalSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            The last section on this page allows you to view, edit/delete, and create new button actions. To view, edit, or delete an action, press on the "Edit" section. To add a new action, press the "Add Action" button. It will automatically add the next action in sequence. You are able to save actions up to nine (9) presses in a row.
          </Text>

          <ButtonActionsListSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            After pressing "Add Action" or "Edit", you will see the following customization panel. If you prefer to keep things simpler, you can choose from one of the many pre-defined Single Actions, ranging from Left Wink to Sleepy Eye.{"\n"}
            If you want more customization, you can create a custom command, at set your button action to run the custom command when executed.
          </Text>

          <CustomButtonActionPanelSVG />
        </>
      }
    />
  )
}