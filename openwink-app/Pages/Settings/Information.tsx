import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import IonIcons from "@expo/vector-icons/Ionicons";
import * as Application from "expo-application";
import BottomSheet from "@gorhom/bottom-sheet";

import { getDevicePasskey } from "../../helper/Functions";
import { CommandSequenceBottomSheet, HeaderWithBackButton, InfoBox } from "../../Components";
import {
  ColorTheme,
  countToEnglish,
  DefaultCommandValueEnglish,
  buttonBehaviorMap
} from "../../helper/Constants";
import { CustomCommandStore, CustomOEMButtonStore } from "../../Storage";
import { ButtonBehaviors, CommandOutput, Presses } from "../../helper/Types";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useBleMonitor } from "../../Providers/BleMonitorProvider";
import { useBleConnection } from "../../Providers/BleConnectionProvider";

export function Information() {

  const { colorTheme, theme, themeName } = useColorTheme();

  const {
    isScanning,
    isConnecting,
    autoConnectEnabled,
    mac,
    isConnected
  } = useBleConnection();

  const {
    firmwareVersion,
    leftStatus,
    rightStatus,
    oemCustomButtonEnabled,
    waveDelayMulti,
    buttonDelay,
    leftRightSwapped,
    leftMoveTime,
    rightMoveTime,
    headlightBypass
  } = useBleMonitor();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [displayedCommand, setDisplayedCommand] = useState(null as CommandOutput | null);

  const headlightStatus = (connected: boolean, status: number) => (
    connected ? (
      status === 1 ?
        "Up" :
        status === 0 ?
          "Down" :
          `%${status}`
    ) : "Unavailable"
  );
  const connectionStatus = (scanning: boolean, connecting: boolean, connected: boolean) => (
    scanning ? "Scanning" : connecting ? "Connecting" : connected ? "Connected" : "Not Connected"
  );

  const appInfo = useMemo(() => ({
    "Pairing Key": getDevicePasskey(),
    "Application Version": `v${Application.nativeApplicationVersion}`,
    "Application Theme": ColorTheme.themeNames[themeName],
  }), [Application.nativeApplicationVersion, themeName])

  const deviceInfo = useMemo(() => ({
    "Module ID": mac || "Not Paired",
    "Firmware Version": firmwareVersion ? `v${firmwareVersion}` : "Unknown",
    "Connection Status": connectionStatus(isScanning, isConnecting, isConnected),
    "Left Headlight Position": headlightStatus(isConnected, leftStatus),
    "Right Headlight Position": headlightStatus(isConnected, rightStatus),
    "Left Move Time": `${leftMoveTime} ms`,
    "Right Move Time": `${rightMoveTime} ms`,
  }), [mac, firmwareVersion, isScanning, isConnecting, isConnected, leftStatus, rightStatus])

  const deviceSettings = useMemo(() => ({
    "Auto Connect": autoConnectEnabled ? "Enabled" : "Disabled",
    "Headlight Perspective": leftRightSwapped ? "Front" : "Driver",
    "Custom Retractor Button": oemCustomButtonEnabled ? "Enabled" : "Disabled",
    "Headlight Bypass": headlightBypass ? "Enabled" : "Disabled",
    "Wave Delay Interval": `${(750 * waveDelayMulti).toFixed(0)} ms`,
    "Press Interval": `${buttonDelay} ms`,
  }), [autoConnectEnabled, Application.nativeApplicationVersion, oemCustomButtonEnabled, waveDelayMulti, buttonDelay]);

  const [rawButtonActions, setRawButtonActions] = useState([] as { numberPresses: Presses; behavior: ButtonBehaviors | CommandOutput; }[]);
  const buttonActions = useMemo(() => rawButtonActions.map(action => {
    if (typeof action.behavior === "string")
      return {
        behaviorHumanReadable: action.behavior,
        presses: action.numberPresses,
        behavior: buttonBehaviorMap[action.behavior],
      }
    else
      return {
        customCommand: action.behavior,
        presses: action.numberPresses,
      }
  }).sort((a, b) => a.presses - b.presses), [rawButtonActions]);

  const [customCommands, setCustomCommands] = useState([] as CommandOutput[]);

  useFocusEffect(useCallback(() => {
    const actions = CustomOEMButtonStore.getAll();
    if (actions)
      setRawButtonActions(actions);
    else setRawButtonActions([]);

    const commands = CustomCommandStore.getAll();
    if (commands)
      setCustomCommands(commands);
    else setCustomCommands([]);
  }, []));

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="System Info"
        headerTextStyle={theme.settingsHeaderText}
      />

      <ScrollView contentContainerStyle={theme.infoContainer}>

        {[
          { title: "App Info", data: appInfo },
          { title: "Module Info", data: deviceInfo },
          { title: "Module Settings", data: deviceSettings },
        ].map((section) => (
          <InfoBox
            key={section.title}
            title={section.title}
            data={section.data}
          />
        ))}

        <View
          style={theme.infoBoxOuter}
          key={"Button Quick Actions"}
        >

          <Text
            style={theme.infoBoxOuterText}>
            Button Quick Actions
          </Text>

          <View style={theme.infoBoxInner}>
            <View
              style={theme.infoBoxInnerContentView}
              key={"Single Press"}
            >
              <Text style={[theme.infoBoxInnerContentText, { opacity: 0.6 }]}>
                Single Press
              </Text>

              <Text style={theme.infoBoxInnerContentText}>
                Default Behavior
              </Text>
            </View>

            {
              buttonActions.map(action => (
                <View
                  style={theme.infoBoxInnerContentView}
                  key={countToEnglish[action.presses]}
                >
                  <Text style={[theme.infoBoxInnerContentText, { opacity: 0.6 }]}>
                    {countToEnglish[action.presses]}
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center", columnGap: 8, }}>

                    <Text style={theme.infoBoxInnerContentText}>
                      {
                        action.customCommand ?
                          action.customCommand.name :
                          action.behaviorHumanReadable
                      }
                    </Text>
                    {
                      action.customCommand ?
                        // TODO: Make pressable --> Open bottom drawer and show sequence
                        <IonIcons name="sparkles-outline" size={18} color={colorTheme.textColor} style={{ marginTop: 1, }} /> : <></>
                    }
                  </View>
                </View>
              ))
            }
          </View>
        </View>

        {
          customCommands.length > 0 ?
            <View
              style={theme.infoBoxOuter}
              key={"Custom Command Presets"}
            >

              <Text style={theme.infoBoxOuterText}>
                Custom Command Presets
              </Text>

              <View style={theme.infoBoxInner}>

                {
                  customCommands.map(command => (
                    <View
                      style={theme.infoBoxInnerContentView}
                      key={command.name}
                    >
                      <Text style={[theme.infoBoxInnerContentText, { opacity: 0.6, width: "40%", height: "auto", }]}>
                        {command.name.length > 14 ? `${command.name.slice(0, 12)}...` : command.name}
                      </Text>


                      <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "55%", height: "auto", columnGap: 8, }}>
                        <Text style={[theme.infoBoxInnerContentText, { width: "85%" }]}>
                          {
                            command.command ? (
                              command.command.map(c => (
                                c.delay ?
                                  `${c.delay} ms Delay` :
                                  DefaultCommandValueEnglish[c.transmitValue! - 1]
                              )).slice(0, 2).join(" → ").slice(0, 16) + "..."
                            ) : "Unknown Error"
                          }
                        </Text>
                        {
                          command.command ? (
                            <Pressable
                              style={{ alignSelf: "flex-start", marginTop: 2, marginRight: 8 }}
                              onPress={() => { setDisplayedCommand(command); bottomSheetRef.current?.expand(); console.log(`pressed command ${command.name}`) }}
                              hitSlop={5}
                            >
                              {
                                ({ pressed }) =>
                                  <IonIcons name="ellipsis-horizontal" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={22} />
                              }
                            </Pressable>
                          ) : <></>
                        }
                      </View>
                    </View>
                  ))
                }
              </View>
            </View>


            : <></>
        }

      </ScrollView>

      <CommandSequenceBottomSheet
        bottomSheetRef={bottomSheetRef}
        close={() => setDisplayedCommand(null)}
        command={displayedCommand!}
      />

    </SafeAreaView>
  )
}