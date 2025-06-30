import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useBLE } from "../hooks/useBLE";
import { ActivityIndicator } from "react-native";

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
}];


export function StandardCommands() {

  const { colorTheme } = useColorTheme();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const { leftStatus, rightStatus, device, isConnecting, isScanning, headlightsBusy, sendDefaultCommand } = useBLE();

  const [disableActions, setDisableActions] = useState(false);

  useEffect(() => {
    if (!device || headlightsBusy || (leftStatus > 0 && leftStatus < 1) || (rightStatus > 0 && rightStatus < 1))
      setDisableActions(true);
    else setDisableActions(false);

  }, [leftStatus, rightStatus, headlightsBusy, device]);


  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 15,
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
          onPress={() => navigation.goBack()}
        >
          {
            (({ pressed }) => (
              <>

                <IonIcons name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                <Text style={{
                  color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  fontWeight: "500",
                  fontSize: 22
                }}>{back}</Text>



                {
                  device ? (
                    <IonIcons name="wifi-outline" color="#367024" size={23} />
                  ) : (
                    isConnecting || isScanning ?
                      <ActivityIndicator color={colorTheme.buttonColor} />
                      : (
                        <IonIcons name="cloud-offline-outline" color="#b3b3b3" size={23} />
                      )
                  )
                }

              </>
            ))
          }

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
            columnGap: 12,
            // backgroundColor: "white"
          }}>
            {
              commands.map((row, i) =>
                <View style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "30%",
                  rowGap: 12,
                }}
                >
                  {
                    row.map((val, j) => (
                      <Pressable
                        style={({ pressed }) => ({
                          width: "100%",
                          height: 48,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                          borderRadius: 7,

                        })}
                        key={val.value}
                        onPress={() => sendDefaultCommand(val.value)}
                        // text={val.name}
                        // textStyle={{}}
                        disabled={disableActions}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            color: disableActions ? colorTheme.disabledButtonTextColor : colorTheme.buttonTextColor,
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

        <View style={{
          width: "100%",
          rowGap: 10
        }}>
          <Text style={{ color: colorTheme.headerTextColor, textAlign: "left", marginLeft: 10, fontSize: 28, fontWeight: "bold" }}>Winks</Text>

          <View style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 12,
            // backgroundColor: "white"
          }}>
            {
              winks.map((row) => (
                <Pressable
                  style={({ pressed }) => ({
                    width: "30%",
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    borderRadius: 7,

                  })}
                  key={row.value}
                  onPress={() => sendDefaultCommand(row.value)}
                  // text={val.name}
                  // textStyle={{}}
                  disabled={disableActions}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: disableActions ? colorTheme.disabledButtonTextColor : colorTheme.buttonTextColor,
                      fontWeight: 500,
                    }}
                  >{row.name}</Text>
                </Pressable>
              ))
            }
          </View>
        </View>


        {/* SECTION: MACROS */}

        <View style={{
          width: "100%",
          rowGap: 10,
        }}>
          <Text
            style={{
              color: colorTheme.headerTextColor,
              textAlign: "left",
              marginLeft: 10,
              fontSize: 28,
              fontWeight: "bold"
            }}
          >Macros</Text>

          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 12,
          }}>

            <View
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
              }}
            >

              <Pressable
                style={({ pressed }) => ({
                  width: "48%",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  borderRadius: 7,

                })}
                key={98}
                onPress={() => sendDefaultCommand(10)}
                disabled={disableActions}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: disableActions ? colorTheme.disabledButtonTextColor : colorTheme.buttonTextColor,
                    fontWeight: 500,
                  }}
                >Left Wave</Text>
              </Pressable>


              <Pressable
                style={({ pressed }) => ({
                  width: "48%",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  borderRadius: 7,

                })}
                key={99}
                onPress={() => sendDefaultCommand(11)}
                disabled={disableActions}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: disableActions ? colorTheme.disabledButtonTextColor : colorTheme.buttonTextColor,
                    fontWeight: 500,
                  }}
                >Right Wave</Text>
              </Pressable>

            </View>


            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 12,
                marginTop: 20,
              }}>

              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                }}
              >

                <Pressable
                  style={({ pressed }) => ({
                    width: "48%",
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    borderRadius: 7,

                  })}
                  key={105}
                  onPress={() => { }}
                  disabled={disableActions}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: colorTheme.buttonTextColor,
                      fontWeight: 500,
                    }}
                  >Sleepy Eye</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => ({
                    width: "48%",
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: !device || !disableActions ?
                      colorTheme.disabledButtonColor :
                      pressed ?
                        colorTheme.buttonColor :
                        colorTheme.backgroundSecondaryColor,
                    borderRadius: 7,

                  })}
                  key={106}
                  onPress={() => { }}
                  disabled={!device || !disableActions}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: !disableActions ? colorTheme.disabledButtonTextColor : colorTheme.buttonTextColor,
                      fontWeight: 500,
                    }}
                  >Reset</Text>
                </Pressable>



              </View>

            </View>
          </View>
        </View>

      </View>

    </View>
  )

}