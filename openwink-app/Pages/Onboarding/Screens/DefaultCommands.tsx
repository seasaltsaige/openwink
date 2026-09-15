import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import LinearGradient from "react-native-linear-gradient";

export function DefaultCommands() {

  const { colorTheme, theme } = useColorTheme();

  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>

      <View style={{ flex: 1, }} />

      <View style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
        transform: [{ rotate: "7deg" }, { scale: 0.85 }],
        marginBottom: -10,
      }}>
        <View style={[theme.defaultCommandSectionContainer, { opacity: 0.6 }]}>

          <Text style={theme.commandSectionHeader}>
            Manual
          </Text>

          <View
            style={
              [
                theme.commandRowContainer,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  opacity: 0.6
                }
              ]
            }>

            <View style={theme.commandColContainer}>

              <View style={[
                theme.commandButton,
                {
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                },
              ]}>

                <Text style={theme.commandButtonText}>
                  Left Up
                </Text>
              </View>

              <View style={[
                theme.commandButton,
                {
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                },
              ]}>

                <Text style={theme.commandButtonText}>
                  Left Down
                </Text>
              </View>

            </View>




            <View style={theme.commandColContainer}>

              <View style={[
                theme.commandButton,
                {
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                },
              ]}>

                <Text style={theme.commandButtonText}>
                  Both Up
                </Text>
              </View>

              <View style={[
                theme.commandButton,
                {
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                },
              ]}>

                <Text style={theme.commandButtonText}>
                  Both Down
                </Text>
              </View>

            </View>


            <View style={theme.commandColContainer}>

              <View style={[
                theme.commandButton,
                {
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                },
              ]}>

                <Text style={theme.commandButtonText}>
                  Right Up
                </Text>
              </View>

              <View style={[
                theme.commandButton,
                {
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                },
              ]}>

                <Text style={theme.commandButtonText}>
                  Right Down
                </Text>
              </View>

            </View>

          </View>

        </View>


        <View style={[theme.defaultCommandSectionContainer, { opacity: 0.6 }]}>

          <Text style={theme.commandSectionHeader}>
            Winks
          </Text>

          <View
            style={
              [
                theme.commandRowContainer,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  opacity: 0.6
                }
              ]
            }>

            <View style={[
              theme.commandButton,
              {
                width: "30%",
                backgroundColor: colorTheme.backgroundSecondaryColor,
              },
            ]}>

              <Text style={theme.commandButtonText}>
                Left Wink
              </Text>
            </View>



            <View style={[
              theme.commandButton,
              {
                width: "30%",
                backgroundColor: colorTheme.backgroundSecondaryColor,
              },
            ]}>
              <Text style={theme.commandButtonText}>
                Both Blink
              </Text>
            </View>


            <View style={[
              theme.commandButton,
              {
                width: "30%",
                backgroundColor: colorTheme.backgroundSecondaryColor,
              },
            ]}>

              <Text style={theme.commandButtonText}>
                Right Wink
              </Text>
            </View>

          </View>

        </View>

        <View style={[theme.defaultCommandSectionContainer, { opacity: 0.6 }]}>

          <Text style={theme.commandSectionHeader}>
            Macros
          </Text>

          <View
            style={
              [
                theme.commandRowContainer,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  opacity: 0.6
                }
              ]
            }>

            <View
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                width: "50%",
                rowGap: 12
              }}
            >

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Left Wave
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                width: "95%",
                paddingHorizontal: 20,
              }]}>

                <Text style={theme.commandButtonText}>
                  Left-Right
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                width: "95%",
                paddingHorizontal: 20,
              }]}>

                <Text style={theme.commandButtonText}>
                  Left-Right x2
                </Text>
              </View>


            </View>

            <View
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                width: "50%",
                rowGap: 12
              }}
            >

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Right Wave
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Right-Left
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Right-Left x2
                </Text>
              </View>
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

      <Text style={{
        fontFamily: "IBMPlexSans_700Bold",
        textAlign: "right",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        marginTop: 20,
      }}>
        Choose ready made actions
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "right",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Show off and say hello to other Miatas with simple, pre-defined actions in the heat of the moment.
      </Text>

    </View>
  )
}