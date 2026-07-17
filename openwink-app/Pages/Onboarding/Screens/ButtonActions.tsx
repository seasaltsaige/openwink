import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";

import IonIcons from "@expo/vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";

export function ButtonActions() {

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


      <View style={{ flex: 1 }} />


      <View style={{
        width: "100%",
        transform: [{ rotate: "5deg" }],
        marginTop: 25,
        rowGap: 15,
        alignItems: "center",
        justifyContent: "center"
      }}>

        <View
          style={{
            backgroundColor: colorTheme.backgroundSecondaryColor,
            width: "100%",
            borderRadius: 10,
            flexDirection: "column",
            alignItems: "center",
            padding: 5,
            paddingTop: 10,
            paddingBottom: 15,
            rowGap: 17,
            marginBottom: 10,
            opacity: 0.6,
          }}>

          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "95%",
            paddingLeft: 5
          }}>
            <Text style={{
              color: colorTheme.headerTextColor,
              fontSize: 18,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center",
            }}>
              Auxiliary Button #2
            </Text>

            <View
              style={{
                marginTop: 2
              }}
            >

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", columnGap: 5 }}>
                <Text style={{
                  color: colorTheme.textColor,
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_500Medium",
                  textAlign: "center",
                }}>
                  Edit
                </Text>
                <IonIcons style={{ marginTop: 2 }} name="chevron-forward" size={20} color={colorTheme.textColor} />
              </View>


            </View>
          </View>

          <View style={{ width: "90%", backgroundColor: `${colorTheme.disabledButtonColor}80`, height: 1.6, borderRadius: 5, }} />


          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "90%",
          }}>
            <View style={{
              rowGap: 10,
            }}>

              <View style={{
                rowGap: 7,
              }}>

                <Text style={{
                  fontFamily: "IBMPlexSans_700Bold",
                  color: colorTheme.textColor,
                  fontSize: 17,
                }}>
                  Selected Action:
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", columnGap: 7 }}>
                  <Text style={{
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.textColor,
                    fontSize: 16,
                  }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Show Loop
                  </Text>
                  <IonIcons name="sparkles-outline" size={16} color={colorTheme.textColor} style={{ marginTop: 2 }} />
                </View>
              </View>

              <View style={{
                rowGap: 7,
              }}>

                <Text style={{
                  fontFamily: "IBMPlexSans_700Bold",
                  color: colorTheme.textColor,
                  fontSize: 17,
                }}>
                  Action Type:
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.textColor,
                    fontSize: 16,
                  }}>
                    Custom Macro
                  </Text>
                </View>
              </View>
            </View>

            <View style={{
              rowGap: 10,
            }}>

              <View style={{
                rowGap: 7,
              }}>

                <Text style={{
                  fontFamily: "IBMPlexSans_700Bold",
                  color: colorTheme.textColor,
                  fontSize: 17,
                }}>
                  Button Type:
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", columnGap: 7 }}>
                  <Text style={{
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.textColor,
                    fontSize: 16,
                  }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Latching
                  </Text>
                </View>
              </View>

              <View style={{
                rowGap: 7,
              }}>

                <Text style={{
                  fontFamily: "IBMPlexSans_700Bold",
                  color: colorTheme.textColor,
                  fontSize: 17,
                }}>
                  Macro Loop:
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.textColor,
                    fontSize: 16,
                  }}>

                    Enabled

                  </Text>
                </View>
              </View>
            </View>
          </View>




          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            columnGap: 7,
            marginTop: -10,
            width: "90%",
          }}>
            <IonIcons style={{ marginTop: 2 }} name="warning-outline" color={"#FFBF00E0"} size={14} />
            <Text style={{
              color: "#FFBF00E0",
              fontFamily: "IBMPlexSans_300Light",
              fontSize: 13
            }}>
              Warning: Unsaved Changes
            </Text>
          </View>
        </View>

        <IonIcons name="ellipsis-vertical" color={`${colorTheme.disabledButtonColor}80`} size={20} style={{ width: 20 }} />

        <View style={theme.mainLongButtonPressableContainer}>
          <View style={theme.mainLongButtonPressableView}>
            <Text style={[theme.mainLongButtonPressableText, { fontSize: 16 }]}>
              Triple Press
            </Text>
          </View>
          <View style={[theme.mainLongButtonPressableIcon, { display: "flex", flexDirection: "row", alignItems: "center", columnGap: 18 }]}>
            <IonIcons color={colorTheme.textColor} name="create-outline" size={18} />
            <IonIcons color={colorTheme.textColor} name="close" size={18} />
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
        textAlign: "right",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        marginTop: 20,
      }}>
        Customize your{"\n"}Button Behaviors
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "right",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Assign premade or customized commands to your OEM retractor button and up to two auxiliary buttons.
      </Text>

    </View>
  )
}