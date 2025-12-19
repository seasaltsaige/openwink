import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function OrientationMovement() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Headlight Orientation & Movement"
      dropdown={
        <>
          <Text
            style={{
              color: `${colorTheme.headerTextColor}`,
              fontFamily: "IBMPlexSans_700Bold",
              width: "100%",
              textAlign: "center",
              fontSize: 16,
            }}
          >
            Headlight Orientation
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
            The module is designed to be installed on the exhaust side of the engine bay, but the connectors are not biased for one side.
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 14,
            }}
          >
            1. If the module is installed on the intake side of the engine bay, left - right orientation will be swapped for both interior and exterior references. Ensuring the module is installed on the exhaust side will correlate headlight side and reference.
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 14,
            }}
          >
            2. Ensure that orientation settings are set correctly. By default, the module prefers internal, cabin based reference. If this does not work, it can be adjusted to an exterior reference.
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}`,
              fontFamily: "IBMPlexSans_700Bold",
              width: "100%",
              textAlign: "center",
              fontSize: 16,
            }}
          >
            Headlight Movement
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 14,
            }}
          >
            1. Send headlights to either up or down position. If one or both headlights move to the opposite position, manually adjust the missbehaving headlight(s) with the adjustment knob on the motor until they are in the correct position.
          </Text>
          

        </>
      }
      key={"orientation"}
    />
  )
}