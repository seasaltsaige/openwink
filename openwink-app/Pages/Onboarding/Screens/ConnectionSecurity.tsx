import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import LinearGradient from "react-native-linear-gradient";
import * as Application from "expo-application";
import { ColorTheme } from "../../../helper/Constants";
import { InfoBox } from "../../../Components";

export function ConnectionSecurity() {

  const { colorTheme, themeName, theme } = useColorTheme();

  const appInfo = {
    "Pairing Key": "8rPiGsOqUvI...",
    "App Version": `v${Application.nativeApplicationVersion!}`,
    "App Theme": ColorTheme.themeNames[themeName],
  };

  const deviceInfo = {
    "Module ID": "24:58:7C:EE:A7:31",
    "Firmware Version": `v0.12.0`,
    "Connection Status": "Connected",
    // "Left Headlight Position": "75%",
    // "Right Headlight Position": "22%",
    // "Left Move Time": `589 ms`,
    // "Right Move Time": `596 ms`,
  };



  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>


      <View style={{ flex: 1 }} />

      <View style={[{
        transform: [{ rotate: "5deg" }]
      }]}>

        <View style={[theme.infoContainer, { opacity: 0.6 }]}>
          <InfoBox
            data={appInfo}
            title="App Info"
          />

          <InfoBox
            data={deviceInfo}
            title="Module Info"
          />
        </View>

        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[colorTheme.backgroundPrimaryColor, "transparent"]}
          style={{
            position: "absolute",
            left: -10,
            top: 0,
            height: "115%",
            width: "110%",
            zIndex: 1000,
          }}
          pointerEvents="none"
        />

      </View>

      <View style={{ flex: 1 }} />


      <Text style={{
        fontFamily: "IBMPlexSans_700Bold",
        textAlign: "right",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        marginTop: 20,
      }}>
        Exclusively Yours
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "right",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        OpenWink pairs with your phone upon first connection, only allowing
        <Text style={{ fontFamily: "IBMPlexSans_700Bold" }}>
          {" "}your{" "}
        </Text>
        device to activate commands remotely, ensuring your headlight system is completely secured.
      </Text>

    </View>
  )
}