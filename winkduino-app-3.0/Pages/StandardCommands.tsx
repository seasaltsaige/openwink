import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { useBLE } from "../hooks/useBLE";
import { OpacityButton } from "../Components/Button";

const commands = [
  [
    {
      name: "Left Up",
      value: 4,
    },
    {
      name: "Left Down",
      value: 5,
    },

  ],
  [
    {
      name: "Both Up",
      value: 1
    },
    {
      name: "Both Down",
      value: 2,
    },

  ],
  [
    {
      name: "Right Up",
      value: 7,
    },
    {
      name: "Right Down",
      value: 8,
    },

  ]
];

const winks = [{
  name: "Left Wink",
  value: 6,
},
{
  name: "Both Blink",
  value: 3,
},
{
  name: "Right Wink",
  value: 9,
}]


export function StandardCommands() {

  const { colorTheme } = useColorTheme();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [isBackPressed, setIsBackPressed] = useState(false);
  const backPressed = (bool: boolean) => setIsBackPressed(bool);

  const { leftStatus, rightStatus, device, isConnecting } = useBLE();

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 25,
      }}
    >

      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>

        <Pressable style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 10,
          height: "100%"
        }}
          onPressIn={() => backPressed(true)}
          onPressOut={() => backPressed(false)}
          onPress={() => navigation.goBack()}
        >
          <IonIcons name="chevron-back-outline" color={isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

          <Text style={{
            color: isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
            fontWeight: "500",
            fontSize: 22
          }}>{back}</Text>
        </Pressable>

        <View>
          <Text style={{
            fontSize: 30,
            fontWeight: "600",
            color: colorTheme.headerTextColor,
            width: "auto",
            marginRight: 10,
          }}
          >Commands</Text>
        </View>
      </View>



      <View style={{
        width: "95%",
        display: "flex",
        flexDirection: "column",
        rowGap: 20,
      }}>


        <View style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          display: "flex",
          alignItems: "center",
          columnGap: 10,
        }}>
          <Text style={{
            fontSize: 17,
            color: colorTheme.headerTextColor,
            fontWeight: "bold",
          }}>
            {
              device === null ?
                "Not Connected" :
                isConnecting ?
                  "Connecting" : "Connected"
            }
          </Text>
          <IonIcons
            color={device === null ?
              "grey" :
              "white"
            }
            size={25}
            name={device === null ?
              "cloud-offline" :
              isConnecting ?
                "cloud" : "cloud-done"
            } />
        </View>



        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            columnGap: 40,
          }}>
          <Text
            style={{
              color: colorTheme.textColor,
              fontSize: 18,
              fontWeight: "bold",
            }}>
            Left: {leftStatus === 0 ? "Down" : leftStatus === 1 ? "Up" : `${leftStatus * 100}%`}
          </Text>

          <Text
            style={{
              color: colorTheme.textColor,
              fontSize: 18,
              fontWeight: "bold",
            }}>
            Right: {rightStatus === 0 ? "Down" : rightStatus === 1 ? "Up" : `${rightStatus * 100}%`}
          </Text>
        </View>


        {/* TODO: send commands to reciever. */}
        <View style={{
          width: "100%",
          rowGap: 10
        }}>
          <Text style={{ color: colorTheme.headerTextColor, textAlign: "left", marginLeft: 10, fontSize: 28, fontWeight: "bold" }}>Manual</Text>

          <View style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 10,
            // backgroundColor: "white"
          }}>
            {
              commands.map((row) =>
                <View style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "30%",
                  rowGap: 10,
                }}>
                  {
                    row.map((val) => (
                      <Pressable
                        style={({ pressed }) => ({
                          width: "100%",
                          height: 50,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                          borderRadius: 7,

                        })}
                        onPress={() => { }}
                        // text={val.name}
                        // textStyle={{}}
                        disabled={false}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            color: colorTheme.buttonTextColor,
                            fontWeight: 500,
                          }}
                        >{val.name}</Text>

                      </Pressable>
                    ))
                  }
                </View>)
            }
          </View>

        </View>

      </View>

    </View>
  )

}