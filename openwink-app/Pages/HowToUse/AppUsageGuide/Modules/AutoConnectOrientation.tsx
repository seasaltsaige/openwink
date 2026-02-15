import { Text } from "react-native";
import { AutoConnectHeadlightOrientationSVG } from "../../../../Components/SVG";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function AutoConnectOrientation() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"auto_connect"}
      headerText="Auto Connect and Headlight Orientation"
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
            To enable or disable Auto Connect, or swap headlight orientation, navigate to the "Settings" page, followed by the "Module Settings" section.

          </Text>

          <AutoConnectHeadlightOrientationSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Auto Connect will make your phone start scanning for your wink mod when the app opens, or when the setting is enabled.
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
            By default, headlight orientation is observed from inside the cabin. Enabling the orientation swap setting will switch the orientation to being referenced from in front of the vehicle.
          </Text>
        </>
      }
    />
  )
}