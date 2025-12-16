import { Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { ConfirmationPanelSVG, ModuleManagementSVG } from "../../../../Components/SVG";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function ModuleManagement() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"sleep_unpair_reset"}
      headerText="Managing the Module"
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
            There are three major management settings located in "Module Settings". One non-destructive action, and two permanent, non-reversable actions.
          </Text>

          <ModuleManagementSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "90%",
              textAlign: "left",
              fontSize: 13,
            }}
          >
            {"    "}• If the car is not planned to be driven for over a month, it is recommended that the module is either removed, or placed into a permanent deep sleep mode, which will only wake when the retractor button is pressed.
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
            {"    "}• Forgetting the module will unpair the phone from the module, allowing for a different phone to connect and pair.
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
            {"    "}• A full module settings reset will delete all saved presets, pairing, and device data off of both the module and the phone, essentially performing a factory reset.  This can also be achieved by pressing the retractor button twenty (20) times in a row.
          </Text>


          <ConfirmationPanelSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Since these actions are potentially dangerous, you will be prompted with a confirmation panel, allowing you to cancel the action if it was an accident.
          </Text>

        </>
      }
    />
  )
}