import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Button() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Button Actions not Working"
      dropdown={
        <>
          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 14,
            }}
          >
            1. Unplug connectors from the headlight module, check connectors for corrosion or bent pins. If pins look normal, reconnect connectors, ensuring they are fully seated until you hear a "click".
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
            2. Press the retractor button twenty (20) times in a row to reset the module to factory defaults.
          </Text>
        </>
      }
      key={"button"}
    />
  )
}