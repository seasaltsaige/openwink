import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { LongButton } from "../../../Components";
import LinearGradient from "react-native-linear-gradient";


export function NextSteps() {

  const { colorTheme, theme } = useColorTheme();

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
        transform: [{ rotate: "-5deg" }]
      }}>

        <View style={[theme.contentContainer, { opacity: 0.6 }]}>
          <View
            style={[theme.homeScreenConnectionButton, { backgroundColor: colorTheme.buttonColor }]}
          >
            <Text style={theme.homeScreenConnectionButtonText}>
              Scan for Wink Module
            </Text>

            <IonIcons name="wifi-outline" size={20} color={colorTheme.headerTextColor} />
          </View>


          <View style={theme.homeScreenButtonsContainer}>
            <Text style={theme.labelHeader}>
              Commands
            </Text>


            <View style={[
              theme.mainLongButtonPressableContainer,
              { backgroundColor: colorTheme.backgroundSecondaryColor }
            ]}>

              <View style={theme.mainLongButtonPressableView}>
                <IonIcons name="color-wand-outline" size={25} color={colorTheme.headerTextColor} />
                <Text style={theme.mainLongButtonPressableText}>
                  Default Commands
                </Text>
              </View>
              <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
            </View>


            <View style={[
              theme.mainLongButtonPressableContainer,
              { backgroundColor: colorTheme.backgroundSecondaryColor }
            ]}>

              <View style={theme.mainLongButtonPressableView}>
                <IonIcons name="sparkles-outline" size={25} color={colorTheme.headerTextColor} />
                <Text style={theme.mainLongButtonPressableText}>
                  Custom Commands
                </Text>
              </View>
              <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
            </View>


            <View style={[
              theme.mainLongButtonPressableContainer,
              { backgroundColor: colorTheme.backgroundSecondaryColor }
            ]}>

              <View style={theme.mainLongButtonPressableView}>
                <IonIcons name="construct-outline" size={25} color={colorTheme.headerTextColor} />
                <Text style={theme.mainLongButtonPressableText}>
                  Create Custom Commands
                </Text>
              </View>
              <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
            </View>

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
        Connect to your OpenWink module
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "left",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Get started with ready made actions, then customize your own sequences and settings when you are ready.
      </Text>

    </View>
  )
}