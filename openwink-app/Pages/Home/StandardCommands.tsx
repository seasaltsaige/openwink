import { Pressable, SafeAreaView, Text, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";

import { useColorTheme } from "../../hooks/useColorTheme";
import {
  DEFAULT_COMMAND_DATA,
  DEFAULT_WINK_DATA,
  MACRO_DATA,
} from "../../helper/Constants";
import { HeaderWithBackButton, MiataHeadlights } from "../../Components";
import { useBleMonitor } from "../../Providers/BleMonitorProvider";
import { useBleCommand } from "../../Providers/BleCommandProvider";
import { useBleConnection } from "../../Providers/BleConnectionProvider";
import { ScrollView } from "react-native-gesture-handler";

type ParamList = {
  StandardCommands: {
    back: string;
  };
};



export function StandardCommands() {
  const { colorTheme, theme } = useColorTheme();
  const route = useRoute<RouteProp<ParamList, "StandardCommands">>();

  const { back } = route.params;

  const {
    isConnected: deviceConnected
  } = useBleConnection();

  const {
    sendDefaultCommand,
    sendSleepyEye,
    sendSyncCommand,
  } = useBleCommand();

  const {
    headlightsBusy,
    isSleepyEyeActive,
    leftStatus,
    rightStatus,
  } = useBleMonitor();

  const canSendMainCommands =
    deviceConnected && !headlightsBusy;

  const canResetHeadlightPositions =
    deviceConnected && !headlightsBusy && !isSleepyEyeActive;

  const getButtonBackgroundColor = (pressed: boolean) => {
    if (!canSendMainCommands) {
      return colorTheme.disabledButtonColor;
    }
    return pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor;
  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%", padding: 15, rowGap: 10, backgroundColor: colorTheme.backgroundPrimaryColor, height: "100%" }}>
        <HeaderWithBackButton
          backText={back}
          headerText="Commands"
          headerTextStyle={theme.settingsHeaderText}
          deviceStatus
        />

        <View style={[theme.contentContainer, { rowGap: 12 }]}>
          <MiataHeadlights
            leftStatus={leftStatus}
            rightStatus={rightStatus}
          />

          <View style={[theme.defaultCommandSectionContainer, {}]}>
            <Text style={theme.commandSectionHeader}>Manual</Text>

            <View style={theme.commandRowContainer}>
              {DEFAULT_COMMAND_DATA.map((row, i) => (
                <View style={theme.commandColContainer} key={i}>
                  {row.map((val, j) => (
                    <Pressable
                      style={({ pressed }) => [
                        theme.commandButton,
                        {
                          backgroundColor:
                            !canSendMainCommands ? colorTheme.disabledButtonColor
                              : pressed ? colorTheme.buttonColor
                                : colorTheme.backgroundSecondaryColor,
                        },
                      ]}
                      key={`${val.value}-${j}`}
                      onPress={() => sendDefaultCommand(val.value)}
                      disabled={!canSendMainCommands}
                    >
                      <Text style={theme.commandButtonText}>{val.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={theme.defaultCommandSectionContainer}>
            <Text style={theme.commandSectionHeader}>Winks</Text>

            <View style={theme.commandRowContainer}>
              {DEFAULT_WINK_DATA.map((row) => (
                <Pressable
                  style={({ pressed }) => [
                    theme.commandButton,
                    {
                      width: "30%",
                      backgroundColor: getButtonBackgroundColor(pressed),
                    },
                  ]}
                  key={row.value}
                  onPress={() => sendDefaultCommand(row.value)}
                  disabled={(!deviceConnected || headlightsBusy)}
                >
                  <Text style={theme.commandButtonText}>{row.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* SECTION: MACROS */}

          <View style={theme.defaultCommandSectionContainer}>
            <Text style={theme.commandSectionHeader}>Macros</Text>

            <View
              style={
                [
                  theme.commandRowContainer,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-evenly"
                  }
                ]
              }>

              {
                MACRO_DATA.map((side_data, i) => (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "flex-start",
                      width: "50%",
                      rowGap: 12
                    }}
                    key={i === 0 ? "Left" : "Right"}>
                    {
                      side_data.map((cmd) => (
                        <Pressable
                          style={({ pressed }) => [
                            theme.commandButton,
                            {
                              width: "95%",
                              backgroundColor:
                                !canSendMainCommands ? colorTheme.disabledButtonColor
                                  : pressed ? colorTheme.buttonColor
                                    : colorTheme.backgroundSecondaryColor,
                            },
                          ]}
                          key={cmd.name}
                          onPress={() => sendDefaultCommand(cmd.command)}
                          disabled={!canSendMainCommands}
                        >
                          <Text style={theme.commandButtonText}>
                            {cmd.name}
                          </Text>
                        </Pressable>
                      ))
                    }
                  </View>
                ))
              }

            </View>

            <View style={{ width: "100%", height: 2, backgroundColor: `${colorTheme.disabledButtonColor}80`, borderRadius: 10, marginVertical: 10 }} />

            <View
              style={[
                theme.commandRowContainer,
                {
                  width: "100%",
                  // marginTop: 15,
                  justifyContent: "space-between",
                  columnGap: 0,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  theme.commandButton,
                  {
                    width: "47%",
                    backgroundColor:
                      !canSendMainCommands ? colorTheme.disabledButtonColor
                        : pressed ? colorTheme.buttonColor
                          : colorTheme.backgroundSecondaryColor,
                  },
                ]}
                key={105}
                onPress={sendSleepyEye}
                disabled={!canSendMainCommands}
              >
                <Text style={theme.commandButtonText}>Sleepy Eye</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  theme.commandButton,
                  {
                    width: "47%",
                    backgroundColor:
                      !canResetHeadlightPositions ?
                        colorTheme.disabledButtonColor
                        : pressed ? colorTheme.buttonColor
                          : colorTheme.backgroundSecondaryColor,
                  },
                ]}
                key={106}
                onPress={sendSyncCommand}
                disabled={!canResetHeadlightPositions}
              >
                <Text style={theme.commandButtonText}>Reset Sleepy</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}
