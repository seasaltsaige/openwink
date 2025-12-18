import { Linking, Pressable, Text } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function Connection() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Connection Trouble"
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
            If you are having trouble connecting to the module, there are a few things that you can try to ensure that your phone is able to discover the module.
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
            1. Ensure that Bluetooth is enabled on your device, with the app having the relevant permissions needed to discover the module.
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
            2. Ensure you are within a reasonable distance from the car, ~10 feet (~3.05 meters) should be more than close enough. If the issue persists, attempt to open the hood of the car, reducing blockage by the car panels.
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
            3. Ensure that all connectors are properly seated where they should go. If a connector is not seated fully, it can cause issues with power delivery, and thus, connectivity.
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
            4. Press the retractor button once to force the module into a wake mode. This state lasts for ~5 minutes, or as long as the phone is connected. This should increase chances for phone/module connectivity.
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
            5. Disconnect the module connector, and reseat the connector to fully power cycle the module.
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
            6. Press the retractor button twenty (20) times in a row to factory reset the module. This should reset any potential settings which could have been conflicting with connection.
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
            If you are still unable to connect to the module, you are able to contact us{" "}
            <Text
              style={{
                color: "#99c3ff",
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "right",
                textDecorationLine: "underline",
                textDecorationColor: "#99c3ff",
              }}
              onPress={() => { }}
            >
              (TBA)
            </Text>
            , or submit a detailed issue report{" "}
            <Text
              style={{
                color: "#99c3ff",
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "right",
                textDecorationLine: "underline",
                textDecorationColor: "#99c3ff",
              }}
              onPress={() => Linking.openURL("https://github.com/seasaltsaige/openwink/issues/new")}
            >
              here
            </Text>
            .
          </Text>

        </>
      }
      key={"connection"}
    />
  )
}