import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useReducer, useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../../hooks/useBLE";
import { BehaviorEnum, countToEnglish, DefaultCommandValue, DefaultCommandValueEnglish } from "../../helper/Constants";
import { buttonBehaviorMap, ButtonBehaviors, CommandOutput, CustomCommandStore, CustomOEMButtonStore, Presses } from "../../Storage";
import * as Application from "expo-application";



type CustomButtonAction = {
  behavior: BehaviorEnum;
  behaviorHumanReadable: ButtonBehaviors;
  presses: Presses;
};


export function Information() {

  const { colorTheme, theme } = useColorTheme();
  const { mac, firmwareVersion, device, isScanning, isConnecting, leftStatus, rightStatus, waveDelayMulti, oemCustomButtonEnabled, autoConnectEnabled, buttonDelay } = useBLE();


  const headlightStatus = (connected: boolean, status: number) => (
    connected ? (
      status === 1 ?
        "Up" :
        status === 0 ?
          "Down" :
          `%${status}`
    ) : "Unknown"
  );
  const connectionStatus = (scanning: boolean, connecting: boolean, connected: boolean) => (
    scanning ? "Scanning" : connecting ? "Connecting" : connected ? "Connected" : "Not Connected"
  );

  const deviceInfo = useMemo(() => ({
    "Module ID": mac,
    "Firmware Version": `v${firmwareVersion}`,
    "App Version": `v${Application.nativeApplicationVersion}`,
    "Connection Status": connectionStatus(isScanning, isConnecting, !!device),
    "Left Headlight Status": headlightStatus(!!device, leftStatus),
    "Right Headlight Status": headlightStatus(!!device, rightStatus),
  }), [mac, firmwareVersion, isScanning, isConnecting, device, leftStatus, rightStatus])

  const deviceSettings = useMemo(() => ({
    "Auto Connect": autoConnectEnabled ? "Enabled" : "Disabled",
    "Custom Retractor Button": oemCustomButtonEnabled ? "Enabled" : "Disabled",
    "Wave Delay Interval": `${(750 * waveDelayMulti).toFixed(2)} ms`,
    "Press Interval": `${buttonDelay} ms`,
  }), [autoConnectEnabled, Application.nativeApplicationVersion, oemCustomButtonEnabled, waveDelayMulti, buttonDelay]);

  const [rawButtonActions, setRawButtonActions] = useState([] as { numberPresses: Presses; behavior: ButtonBehaviors; }[]);
  const buttonActions = useMemo(() => rawButtonActions.map(action => ({
    behaviorHumanReadable: action.behavior,
    presses: action.numberPresses,
    behavior: buttonBehaviorMap[action.behavior],
  })).sort((a, b) => a.presses - b.presses), [rawButtonActions]);

  // TEMP: for testing until actual custom commands are implemented
  // const [customCommands, setCustomCommands] = useState([
  //   { name: "Test Command", command: [{ transmitValue: DefaultCommandValue.RIGHT_WINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
  //   { name: "Test Command 2", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
  //   { name: "Test Command 3", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
  //   { name: "Test Command 4", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
  //   { name: "Test Command 5", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
  //   { name: "Test Command 6", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
  // ] as CommandOutput[]);
  const [customCommands, setCustomCommands] = useState([] as CommandOutput[]);


  const [customCommandsExpandedState, dispatchCustomCommands] = useReducer((state: { [key: string]: boolean }, action: { name: string }) => ({
    ...state,
    [action.name]: !state[action.name],
  }), customCommands.reduce((accum, curr) => {
    accum[curr.name] = false
    return accum;
  }, {} as { [key: string]: boolean }));


  useFocusEffect(() => {
    (async () => {
      const actions = await CustomOEMButtonStore.getAll();
      if (actions)
        setRawButtonActions(actions);
      else setRawButtonActions([]);

      const commands = await CustomCommandStore.getAll();
      if (commands)
        setCustomCommands(commands);
      else setCustomCommands([]);
    })();
  });

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const openGithub = async (type: "module" | "software") => {
    if (type === "module")
      await Linking.openURL("https://github.com/pyroxenes");
    else if (type === "software")
      await Linking.openURL("https://github.com/seasaltsaige");
  }

  return (
    <View style={theme.container}>

      <View style={theme.headerContainer}>
        <Pressable
          style={theme.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          {
            ({ pressed }) => (
              <>
                <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                  {back}
                </Text>
              </>
            )
          }
        </Pressable>


        <Text style={theme.subSettingHeaderText}>
          Information
        </Text>

      </View>


      <ScrollView contentContainerStyle={theme.infoContainer}>

        {
          ([
            ["Device Info", deviceInfo],
            ["Device Settings", deviceSettings],
          ] as const).map(val => (

            <View
              style={theme.infoBoxOuter}
              key={val[0]}
            >
              <Text style={theme.infoBoxOuterText}>
                {val[0]}
              </Text>

              <View style={theme.infoBoxInner}>
                {
                  Object.keys(val[1]).map((key) => (
                    <View
                      style={theme.infoBoxInnerContentView}
                      key={key}
                    >


                      <Text style={[theme.infoBoxInnerContentText, { opacity: 0.6 }]}>
                        {key}
                      </Text>

                      <Text style={theme.infoBoxInnerContentText}>
                        {
                          //@ts-ignore
                          val[1][key]
                        }
                      </Text>
                    </View>
                  ))
                }
              </View>

            </View>
          ))
        }

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

                  <Text style={theme.infoBoxInnerContentText}>
                    {action.behaviorHumanReadable}
                  </Text>
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
                        {command.name}
                      </Text>


                      <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "55%", height: "auto", columnGap: 8, }}>
                        <Text style={[theme.infoBoxInnerContentText, { width: "85%" }]}>
                          {
                            command.command ? (
                              customCommandsExpandedState[command.name] ? (
                                command.command.map(c => (
                                  c.delay ?
                                    `${c.delay} ms Delay` :
                                    DefaultCommandValueEnglish[c.transmitValue! - 1]
                                )).join(" → ")
                              ) : (
                                command.command.map(c => (
                                  c.delay ?
                                    `${c.delay} ms Delay` :
                                    DefaultCommandValueEnglish[c.transmitValue! - 1]
                                )).slice(0, 2).join(" → ").slice(0, 16) + "..."
                              )
                            ) : "Unknown Error Getting Command"
                          }
                        </Text>
                        {
                          command.command ? (
                            <Pressable
                              style={{ alignSelf: "flex-start", marginTop: 2, marginRight: 8 }}
                              onPress={() => dispatchCustomCommands({ name: command.name })}
                              hitSlop={5}
                            >
                              {
                                ({ pressed }) =>
                                  <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={22} name={customCommandsExpandedState[command.name] ? "chevron-up" : "chevron-down"} />
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






      {/* <View style={[theme.infoFooterContainer, { height: 60, flexDirection: "column", rowGap: 5 }]}>
        <Pressable
          style={({ pressed }) => [pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer, { marginBottom: 8 }]}
          onPress={() => {
            // Install update to wink module
            // Should only become this state if connected to wink module (To check device for version)
          }}
        >
          <View style={theme.mainLongButtonPressableView}>
            <Text style={theme.mainLongButtonPressableText}>
              Check for Module Update
            </Text>
          </View>

          <IonIcons name="cloud-download-outline" style={theme.mainLongButtonPressableIcon} size={20} color={colorTheme.textColor} />
        </Pressable> */}

      {/* <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 4 }}>
          <Text style={theme.infoFooterText}>
            Module hardware developed and maintained by
          </Text>

          <Pressable
            onPress={() => openGithub("module")}
          >
            {
              ({ pressed }) => <Text style={[theme.infoFooterText, {
                color: "#99c3ff",
                textDecorationLine: pressed ? "underline" : "none"
              }]}>
                @pyroxenes
              </Text>
            }

          </Pressable>
        </View>

        <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 4 }}>
          <Text style={theme.infoFooterText}>

            Module software developed and maintained by
          </Text>
          <Pressable
            onPress={() => openGithub("software")}
          >
            {
              ({ pressed }) => <Text style={[theme.infoFooterText, {
                color: "#99c3ff",
                textDecorationLine: pressed ? "underline" : "none"
              }]}>
                @seasaltsaige
              </Text>
            }

          </Pressable>
        </View> */}
      {/* </View> */}

    </View >
  )
}