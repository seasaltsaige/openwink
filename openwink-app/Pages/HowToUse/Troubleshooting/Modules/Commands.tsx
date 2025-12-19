// Commands saying sent but not executing
// check connectors, restart app, reconnect, reset module
import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Commands() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Commands not Executing"
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
            1. Unplug connectors from the headlight motors and module, check connectors for corrosion or bent pins. If pins look normal, reconnect connectors, ensuring they are fully seated until you hear a "click".
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
            2. Occasionally connection can timeout and not update on the app. Restarting the app, then reconnecting to the module usually fixes this issue.
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
            3. If the above steps do not solve the issue, press the retractor button twenty (20) times in a row to reset the module to factory defaults.
          </Text>
        </>
      }
      key={"commands"}
    />
  )
}