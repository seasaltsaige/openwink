import { Pressable, SafeAreaView, Text, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";

import { useColorTheme } from "../../hooks/useColorTheme";
import {
  DEFAULT_COMMAND_DATA,
  DEFAULT_WINK_DATA,
} from "../../helper/Constants";
import { HeaderWithBackButton, MiataHeadlights } from "../../Components";
import { useBleMonitor } from "../../Providers/BleMonitorProvider";
import { useBleCommand } from "../../Providers/BleCommandProvider";
import { useBleConnection } from "../../Providers/BleConnectionProvider";

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
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="Commands"
        headerTextStyle={theme.settingsHeaderText}
        deviceStatus
      />

      <View style={theme.contentContainer}>
        <MiataHeadlights
          leftStatus={leftStatus}
          rightStatus={rightStatus}
        />

        <View style={theme.defaultCommandSectionContainer}>
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
            style={[theme.commandRowContainer, { flexDirection: "column" }]}
          >
            <View
              style={[
                theme.commandRowContainer,
                { width: "100%", columnGap: 0, justifyContent: "space-evenly" },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  theme.commandButton,
                  {
                    width: "48%",
                    backgroundColor:
                      !canSendMainCommands ? colorTheme.disabledButtonColor
                        : pressed ? colorTheme.buttonColor
                          : colorTheme.backgroundSecondaryColor,
                  },
                ]}
                key={98}
                onPress={() => sendDefaultCommand(10)}
                disabled={!canSendMainCommands}
              >
                <Text style={theme.commandButtonText}>Left Wave</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  theme.commandButton,
                  {
                    width: "48%",
                    backgroundColor:
                      !canSendMainCommands ? colorTheme.disabledButtonColor
                        : pressed ? colorTheme.buttonColor
                          : colorTheme.backgroundSecondaryColor,
                  },
                ]}
                key={99}
                onPress={() => sendDefaultCommand(11)}
                disabled={!canSendMainCommands}
              >
                <Text style={theme.commandButtonText}>Right Wave</Text>
              </Pressable>
            </View>

            <View
              style={[
                theme.commandRowContainer,
                { flexDirection: "column", marginTop: 20 },
              ]}
            >
              <View
                style={[
                  theme.commandRowContainer,
                  {
                    width: "100%",
                    justifyContent: "space-evenly",
                    columnGap: 0,
                  },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    theme.commandButton,
                    {
                      width: "48%",
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
                      width: "48%",
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
                  <Text style={theme.commandButtonText}>Reset</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
