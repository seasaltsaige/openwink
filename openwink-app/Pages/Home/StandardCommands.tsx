import { Pressable, SafeAreaView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { useColorTheme } from "../../hooks/useColorTheme";
import { DEFAULT_COMMAND_DATA, DEFAULT_WINK_DATA } from "../../helper/Constants";
import { HeaderWithBackButton } from "../../Components";
import { useBLE } from "../../hooks/useBLE";

export function StandardCommands() {

  const { colorTheme, theme } = useColorTheme();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const {
    leftStatus,
    rightStatus,
    device,
    isConnecting,
    isScanning,
    headlightsBusy,
    sendDefaultCommand,
    sendSleepyEye,
    sendSyncCommand
  } = useBLE();

  const deviceConnected = device &&
    !headlightsBusy &&
    !isScanning &&
    !isConnecting;

  const canSendMainCommands = deviceConnected &&
    (leftStatus === 0 || leftStatus === 1) &&
    (rightStatus === 0 || rightStatus === 1);

  const canSync = deviceConnected &&
    (leftStatus !== 0 && leftStatus !== 1) &&
    (rightStatus !== 0 && rightStatus !== 1);

  return (
    <SafeAreaView style={theme.container}>

      <HeaderWithBackButton
        backText={back}
        headerText="Commands"
        headerTextStyle={theme.settingsHeaderText}
        deviceStatus
      />

      <View style={theme.contentContainer}>

        <View style={theme.headlightStatusContainer}>
          {
            ([
              ["Left", leftStatus],
              ["Right", rightStatus]
            ] as const).map(([label, status], i) => (
              <View
                key={i}
                style={theme.headlightStatusSideContainer}
              >
                {/* HEADLIGHT STATUS TEXT */}
                <Text style={theme.headlightStatusText}>
                  {label}: {status === 0 ? "Down" : status === 1 ? "Up" : `${(status * 100).toFixed(0)}%`}
                </Text>

                {/* HEADLIGHT STATUS BAR */}
                <View style={theme.headlightStatusBarUnderlay}>
                  <View style={[theme.headlightStatusBarOverlay, { width: `${status * 100}%`, }]} />
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
                        backgroundColor: !canSendMainCommands ? colorTheme.disabledButtonColor
                          : pressed ? colorTheme.buttonColor
                            : colorTheme.backgroundSecondaryColor,
                      }]
                    )}
                    key={val.value}
                    onPress={() => sendDefaultCommand(val.value)}
                    disabled={!canSendMainCommands}
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
                    backgroundColor: !canSendMainCommands ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  }
                ])}
                key={row.value}
                onPress={() => sendDefaultCommand(row.value)}
                disabled={!canSendMainCommands}
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
                    backgroundColor: !canSendMainCommands ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  }
                ])}
                key={98}
                onPress={() => sendDefaultCommand(10)}
                disabled={!canSendMainCommands}
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
                    backgroundColor: !canSendMainCommands ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  }
                ])}
                key={99}
                onPress={() => sendDefaultCommand(11)}
                disabled={!canSendMainCommands}
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
                      backgroundColor: !canSendMainCommands ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    }
                  ])}
                  key={105}
                  onPress={sendSleepyEye}
                  disabled={!canSendMainCommands}
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
                      backgroundColor: !canSync ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    }
                  ])}
                  key={106}
                  onPress={sendSyncCommand}
                  disabled={!canSync}
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
    </SafeAreaView>
  )
}