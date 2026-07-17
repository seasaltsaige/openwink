import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";

import IonIcons from "@expo/vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";

const updateSizeKB = 648.39;
const updateProgress = 34;

export function Updates() {

  const { colorTheme } = useColorTheme();

  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>



      <View style={{ flex: 1 }} />



      <View style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        // marginBottom: 50
        marginTop: 55,
        transform: [{ rotate: "-3deg" }]
      }}>
        <View
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 20,
            rowGap: 17,
            opacity: 0.6
          }}
        >

          <Text style={{
            color: colorTheme.textColor,
            fontFamily: "IBMPlexSans_500Medium",
            fontSize: 16,
          }}>
            Updating Firmware... ({updateProgress}%)
          </Text>

          <View style={{
            width: "100%",
            marginHorizontal: 10,
            flexDirection: "row",
            alignItems: "center",
            position: "relative",
          }}>
            <View style={{
              width: "100%",
              backgroundColor: `${colorTheme.disabledButtonColor}80`,
              height: 16,
              position: "absolute",
              borderRadius: 10,
            }} />
            <View style={{
              width: `${updateProgress}%`,
              backgroundColor: colorTheme.buttonColor,
              height: 16,
              position: "absolute",
              borderRadius: 10,
            }} />
          </View>

          <Text style={{
            color: colorTheme.textColor,
            fontFamily: "IBMPlexSans_400Regular",
            fontSize: 14,
            textAlign: "center",
          }}>
            ({((updateSizeKB * updateProgress) / 100).toFixed(2)}KB/{(updateSizeKB).toFixed(2)}KB) – {`v1.0.43`}
          </Text>

          <Text style={{
            marginTop: -10,
            color: colorTheme.textColor,
            fontFamily: "IBMPlexSans_400Regular",
            fontSize: 14,
            textAlign: "center"
          }}>
            Adds configurable button action options for running custom macros in a continuous loop until canceled via button press.
          </Text>

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 5,
          }}>
            <IonIcons name="warning-outline" color={colorTheme.warning} size={17} />

            <Text style={{
              color: colorTheme.warning,
              fontFamily: "IBMPlexSans_400Regular",
              fontSize: 11,
              textAlign: "center"
            }}>
              Do not disconnect while module update is in progress
            </Text>
          </View>
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
        textAlign: "left",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        marginTop: 20,
      }}>
        Get firmware updates Wirelessly
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "left",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Update your module directly in the app and unlock new features all without removing the module from the car. Get back to winking
        <Text style={{ fontFamily: "IBMPlexSans_700Bold" }}>{" "}faster.</Text>
      </Text>

    </View>
  )
}