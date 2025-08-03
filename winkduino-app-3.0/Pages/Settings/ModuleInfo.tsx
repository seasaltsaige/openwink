import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../../hooks/useBLE";
import { BehaviorEnum, countToEnglish, DefaultCommandValue, DefaultCommandValueEnglish } from "../../helper/Constants";
import { buttonBehaviorMap, ButtonBehaviors, CommandOutput, CustomOEMButtonStore, Presses } from "../../Storage";



type CustomButtonAction = {
  behavior: BehaviorEnum;
  behaviorHumanReadable: ButtonBehaviors;
  presses: Presses;
};


export function ModuleInfo() {

  const { colorTheme, theme } = useColorTheme();
  const { mac, firmwareVersion, device, isScanning, isConnecting, leftStatus, rightStatus, waveDelayMulti, oemCustomButtonEnabled, autoConnectEnabled, buttonDelay } = useBLE();

  const [deviceInfo, setDeviceInfo] = useState({
    "Module ID": mac,
    "Firmware Version": `v${firmwareVersion}`,
    "Connection Status": isScanning ? "Scanning" : isConnecting ? "Connecting" : device !== null ? "Connected" : "Not Connected",
    "Left Headlight Status": !device ? "Unknown" : leftStatus === 1 ? "Up" : leftStatus === 0 ? "Down" : `%${leftStatus}`,
    "Right Headlight Status": !device ? "Unknown" : rightStatus === 1 ? "Up" : rightStatus === 0 ? "Down" : `%${rightStatus}`,
  });

  const [deviceSettings, setDeviceSettings] = useState({
    "Auto Connect": autoConnectEnabled ? "Enabled" : "Disabled",
    "Custom Retractor Button": oemCustomButtonEnabled ? "Enabled" : "Disabled",
    // NOTE: TEMP --- MUST BE CHANGED WHEN DELAY INPUT ON ESP CHANGES THIS VALUE
    "Wave Delay Interval": `${(750 * waveDelayMulti).toFixed(2)} ms`,
    "Press Interval": `${buttonDelay} ms`,
  });

  const [buttonActions, setButtonActions] = useState([] as CustomButtonAction[]);

  const [customCommands, setCustomCommands] = useState([
    { name: "Test Command", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
    { name: "Test Command 2", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
    { name: "Test Command 3", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
    { name: "Test Command 4", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
    { name: "Test Command 5", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
    { name: "Test Command 6", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },

  ] as CommandOutput[]);

  useEffect(() => {
    setDeviceInfo({
      "Module ID": mac,
      "Firmware Version": `v${firmwareVersion}`,
      "Connection Status": isScanning ? "Scanning" : isConnecting ? "Connecting" : device !== null ? "Connected" : "Not Connected",
      "Left Headlight Status": !device ? "Unknown" : leftStatus === 1 ? "Up" : leftStatus === 0 ? "Down" : `%${leftStatus}`,
      "Right Headlight Status": !device ? "Unknown" : rightStatus === 1 ? "Up" : rightStatus === 0 ? "Down" : `%${rightStatus}`,
    });

    setDeviceSettings({
      "Auto Connect": autoConnectEnabled ? "Enabled" : "Disabled",
      "Custom Retractor Button": oemCustomButtonEnabled ? "Enabled" : "Disabled",
      "Wave Delay Interval": `${(750 * waveDelayMulti).toFixed(2)} ms`,
      "Press Interval": `${buttonDelay} ms`,
    });

  }, [mac, firmwareVersion, device, isConnecting, isScanning, waveDelayMulti, leftStatus, rightStatus, oemCustomButtonEnabled, autoConnectEnabled, buttonDelay]);

  useFocusEffect(() => {
    (async () => {
      const actions = await CustomOEMButtonStore.getAll();
      if (actions)
        setButtonActions(actions.map(action => ({
          behaviorHumanReadable: action.behavior,
          presses: action.numberPresses,
          behavior: buttonBehaviorMap[action.behavior],
        })).sort((a, b) => a.presses - b.presses));
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
          Module Info
        </Text>

      </View>


      <ScrollView contentContainerStyle={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        rowGap: 15,
        // height: "%",
      }}>


        {
          ([
            ["Device Info", deviceInfo],
            ["Device Settings", deviceSettings],
            // ["Button Quick Actions"]
          ] as const).map(val => (
            <View style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-start",

              // backgroundColor: "pink",
              rowGap: 5
            }}
              key={val[0]}
            >
              <Text style={{
                color: colorTheme.headerTextColor,
                fontFamily: "IBMPlexSans_700Bold",
                fontSize: 19,
                textAlign: "left",
                minWidth: "100%",
                // backgroundColor: "orange",
              }}>
                {val[0]}
              </Text>

              <View style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
                backgroundColor: colorTheme.backgroundSecondaryColor,
                borderRadius: 5,
                padding: 15,
                paddingVertical: 8,
                rowGap: 4
              }}>



                {
                  Object.keys(val[1]).map((key) => (
                    <View style={{
                      display: "flex",
                      flexDirection: "row",
                      alignContent: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                      key={key}
                    >


                      <Text style={{ color: colorTheme.textColor, opacity: 0.6, fontFamily: "IBMPlexSans_500Medium", fontSize: 17 }}>
                        {key}
                      </Text>

                      <Text style={{ color: colorTheme.textColor, opacity: 1, fontFamily: "IBMPlexSans_500Medium", fontSize: 17 }}>
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

        <View style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 5
        }}
          key={"Button Quick Actions"}
        >

          <Text style={{
            color: colorTheme.headerTextColor,
            fontFamily: "IBMPlexSans_700Bold",
            fontSize: 19,
            textAlign: "left",
            minWidth: "100%",
          }}>
            Button Quick Actions
          </Text>

          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 5,
            padding: 15,
            paddingVertical: 8,
            rowGap: 4
          }}>
            <View style={{
              display: "flex",
              flexDirection: "row",
              alignContent: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
              key={"Single Press"}
            >
              <Text style={{ color: colorTheme.textColor, opacity: 0.6, fontFamily: "IBMPlexSans_500Medium", fontSize: 17 }}>
                Single Press
              </Text>

              <Text style={{ color: colorTheme.textColor, opacity: 1, fontFamily: "IBMPlexSans_500Medium", fontSize: 17 }}>
                Default Behavior
              </Text>
            </View>

            {
              buttonActions.map(action => (
                <View style={{
                  display: "flex",
                  flexDirection: "row",
                  alignContent: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
                  key={countToEnglish[action.presses]}
                >
                  <Text style={{ color: colorTheme.textColor, opacity: 0.6, fontFamily: "IBMPlexSans_500Medium", fontSize: 17 }}>
                    {countToEnglish[action.presses]}
                  </Text>

                  <Text style={{ color: colorTheme.textColor, opacity: 1, fontFamily: "IBMPlexSans_500Medium", fontSize: 17 }}>
                    {
                      action.behaviorHumanReadable
                    }
                  </Text>
                </View>
              ))
            }
          </View>
        </View>

        {
          customCommands.length > 0 ?
            <View style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-start",
              rowGap: 5
            }}
              key={"Custom Command Presets"}
            >

              <Text style={{
                color: colorTheme.headerTextColor,
                fontFamily: "IBMPlexSans_700Bold",
                fontSize: 19,
                textAlign: "left",
                minWidth: "100%",
              }}>
                Custom Command Presets
              </Text>

              <View style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
                backgroundColor: colorTheme.backgroundSecondaryColor,
                borderRadius: 5,
                padding: 15,
                paddingVertical: 8,
                rowGap: 10
              }}>

                {
                  customCommands.map(command => (
                    <View style={{
                      display: "flex",
                      flexDirection: "row",
                      alignContent: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                      key={command.name}
                    >
                      <Text style={{ color: colorTheme.textColor, opacity: 0.6, fontFamily: "IBMPlexSans_500Medium", fontSize: 17, width: "40%", height: "auto" }}>
                        {command.name}
                      </Text>

                      <Text style={{ color: colorTheme.textColor, opacity: 1, fontFamily: "IBMPlexSans_500Medium", fontSize: 17, width: "55%", height: "auto" }}>
                        {
                          command.command ? command.command.map(c => c.delay ? `${c.delay} ms Delay` : DefaultCommandValueEnglish[c.transmitValue! - 1]).join(" → ") : "Unknown Error Getting Command"
                        }
                      </Text>
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