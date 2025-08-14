import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useBLE } from "../../hooks/useBLE";
import { ActivityIndicator } from "react-native";
import { DEFAULT_COMMAND_DATA, DEFAULT_WINK_DATA } from "../../helper/Constants";
import { HeaderWithBackButton } from "../../Components";

export function StandardCommands() {

  const { colorTheme, theme } = useColorTheme();
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
    <View style={theme.container}>

      <HeaderWithBackButton
        backText={back}
        headerText="Commands"
        headerTextStyle={theme.settingsHeaderText}
      />

      <View style={theme.contentContainer}>

        <View style={theme.headlightStatusContainer}>
          {
            [
              ["Left", leftStatus],
              ["Right", rightStatus]
            ].map(([label, status], i) => (
              <View
                key={i}
                style={theme.headlightStatusSideContainer}
              >
                {/* HEADLIGHT STATUS TEXT */}
                <Text style={theme.headlightStatusText}>
                  {label}: {status === 0 ? "Down" : status === 1 ? "Up" : `${(status as number * 100).toFixed(0)}%`}
                </Text>

                {/* HEADLIGHT STATUS BAR */}
                <View style={theme.headlightStatusBarUnderlay}>
                  <View style={[theme.headlightStatusBarOverlay, { width: `${status as number * 100}%`, }]} />
                </View>
              </View>
            ))}
        </View>



        <View style={theme.defaultCommandSectionContainer}>
          <Text style={theme.commandSectionHeader}>
            Manual
          </Text>

          <View style={theme.commandRowContainer}>
            {DEFAULT_COMMAND_DATA.map((row, i) =>
              <View
                style={theme.commandColContainer}
                key={i}
              >
                {row.map((val, j) => (
                  <Pressable
                    style={({ pressed }) => (
                      [theme.commandButton, {
                        backgroundColor: disableActions ? colorTheme.disabledButtonColor
                          : pressed ? colorTheme.buttonColor
                            : colorTheme.backgroundSecondaryColor,
                      }]
                    )}
                    key={val.value}
                    onPress={() => sendDefaultCommand(val.value)}
                    disabled={disableActions}
                  >
                    <Text style={theme.commandButtonText}>
                      {val.name}
                    </Text>

                  </Pressable>
                ))}
              </View>)}
          </View>

        </View>

        <View style={theme.defaultCommandSectionContainer}>
          <Text style={theme.commandSectionHeader}>
            Winks
          </Text>

          <View style={theme.commandRowContainer}>
            {DEFAULT_WINK_DATA.map((row) => (
              <Pressable
                style={({ pressed }) => ([
                  theme.commandButton,
                  {
                    width: "30%",
                    backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  }
                ])}
                key={row.value}
                onPress={() => sendDefaultCommand(row.value)}
                disabled={disableActions}
              >
                <Text style={theme.commandButtonText}>
                  {row.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>


        {/* SECTION: MACROS */}

        <View style={theme.defaultCommandSectionContainer}>
          <Text style={theme.commandSectionHeader}>
            Macros
          </Text>

          <View style={[theme.commandRowContainer, { flexDirection: "column" }]}>

            <View style={[theme.commandRowContainer, { width: "100%", columnGap: 0, justifyContent: "space-evenly" }]}>

              <Pressable
                style={({ pressed }) => ([
                  theme.commandButton,
                  {
                    width: "48%",
                    backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  }
                ])}
                key={98}
                onPress={() => sendDefaultCommand(10)}
                disabled={disableActions}
              >
                <Text style={theme.commandButtonText}>
                  Left Wave
                </Text>
              </Pressable>


              <Pressable
                style={({ pressed }) => ([
                  theme.commandButton,
                  {
                    width: "48%",
                    backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  }
                ])}
                key={99}
                onPress={() => sendDefaultCommand(11)}
                disabled={disableActions}
              >
                <Text style={theme.commandButtonText}>
                  Right Wave
                </Text>
              </Pressable>

            </View>


            <View style={[theme.commandRowContainer, { flexDirection: "column", marginTop: 20 }]}>
              <View style={[theme.commandRowContainer, { width: "100%", justifyContent: "space-evenly", columnGap: 0 }]}>
                <Pressable
                  style={({ pressed }) => ([
                    theme.commandButton,
                    {
                      width: "48%",
                      backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    }
                  ])}
                  key={105}
                  onPress={() => { }}
                  disabled={disableActions}
                >
                  <Text style={theme.commandButtonText}>
                    Sleepy Eye
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => ([
                    theme.commandButton,
                    {
                      width: "48%",
                      backgroundColor: disableActions ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    }
                  ])}
                  key={106}
                  onPress={() => { }}
                  disabled={!device || !disableActions}
                >
                  <Text style={theme.commandButtonText}>
                    Reset
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}