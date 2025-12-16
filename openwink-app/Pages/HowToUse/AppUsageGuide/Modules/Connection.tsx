import { Text } from "react-native";
import { ConnectionSVG } from "../../../../Components/SVG";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Connection() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"connection"}
      headerText="Connecting to your Module"
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
            To connect to your new OpenWink Module,
            ensure you are close to your car
            — the closer the better —
            then navigate to the home screen,
            and press the first button labeled "Scan for Wink Module".
          </Text>

          <ConnectionSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 14,
            }}
          >
            If you are having trouble connecting to the module, actuating the retractor button will wake the module for 5 minutes, making establishing connection easier.
          </Text>
        </>
      }
    />
  )
}