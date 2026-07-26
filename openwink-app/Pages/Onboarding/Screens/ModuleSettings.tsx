import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { InfoBox } from "../../../Components";
import LinearGradient from "react-native-linear-gradient";

export function ModuleSettings() {
  const { colorTheme, theme } = useColorTheme();


  const deviceSettings = {
    "Auto Connect": "Disabled",
    "Headlight Perspective": "Driver",
    "Custom Retractor Button": "Enabled",
    "Headlight Bypass": "Enabled",
    "Wave Delay Interval": `${(206.25).toFixed(0)} ms`,
    "Press Interval": `350 ms`,
  };

  const buttonActions = {
    "Single Press": "Default Behavior",
    "Double Press": "Left-Right x2",
    "Triple Press": "Sleepy Eye",
  }


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

      <View style={{
        width: "100%",
        transform: [{ rotate: "5deg" }],
      }}>

        <View style={{ opacity: 0.6, rowGap: 15, }}>
          <InfoBox
            title="Module Settings"
            data={deviceSettings}
          />

          <InfoBox
            title="Button Quick Actions"
            data={buttonActions}
          />
        </View>


        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[colorTheme.backgroundPrimaryColor, "transparent"]}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "115%",
            width: "100%",
            zIndex: 1000,
            opacity: 1,
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
        Your Miata, Your Rules
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "right",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Personalize your module's delays; customize actions and sleepy eye height. Make your Miata feel uniquely
        <Text style={{ fontFamily: "IBMPlexSans_700Bold" }}>
          {" "}yours.
        </Text>
      </Text>

    </View>
  )
}