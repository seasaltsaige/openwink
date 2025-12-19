import { Text } from "react-native";
import { FirmwareInstallingSVG, InstallFirmwareButtonSVG } from "../../../../Components/SVG";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Firmware() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"update"}
      headerText="Firmware Updates"
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
            When a firmware update is available, in the "Updates" section on the Home screen, the firmware section will display as follows.
          </Text>
          <InstallFirmwareButtonSVG />
          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Pressing on the button will initiate the update process, and the following modal will display.
          </Text>
          <FirmwareInstallingSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            To ensure that the update completes successfully, remain nearby the car for the duration of the update.{"\n"}
            An update should take ~30 seconds to a minute, but can take longer if the connection is unstable.
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 13,
            }}
          >
            If an update hangs, or takes longer than 5 minutes to complete, try to restart the app and restart the update proceedure.
          </Text>

        </>
      }
    />
  )
}