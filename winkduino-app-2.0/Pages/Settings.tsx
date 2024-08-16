import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import InputSpinner from "react-native-input-spinner";
import { Picker, PickerItemProps } from "@react-native-picker/picker";

import { useEffect, useState } from "react";


import { OpacityButton } from "../Components/OpacityButton";
import CheckBox from "react-native-bouncy-checkbox";
import { AutoConnectStore, CustomCommandStore, DeviceMACStore, SleepyEyeStore } from "../AsyncStorage";
import { DeleteDataWarning } from "./DeleteDataWarning";
interface SettingsProps {
  visible: boolean;
  close: () => void;
}

export function Settings(props: SettingsProps) {

  const [pairedMAC, setPairedMAC] = useState<string | undefined>();

  const [leftHeadlight, setLeftHeadlight] = useState(50);
  const [rightHeadlight, setRightHeadlight] = useState(50);

  const [toUpdateLeft, setToUpdateLeft] = useState<undefined | number>();
  const [toUpdateRight, setToUpdateRight] = useState<undefined | number>();

  const [autoConnectSetting, setAutoConnectSetting] = useState(true);


  const [deleteDataPopup, setDeleteDataPopup] = useState(false);

  const [sleepNum, setSleepNum] = useState(0);

  // FETCH SETTINGS
  const fetchPairing = async () => {
    const storedMAC = await DeviceMACStore.getStoredMAC();
    setPairedMAC(storedMAC);
  }

  const fetchHeadlightSettings = async () => {
    const left = await SleepyEyeStore.get("left");
    const right = await SleepyEyeStore.get("right");

    if (left) setLeftHeadlight(left);
    else setLeftHeadlight(50);

    if (right) setRightHeadlight(right);
    else setRightHeadlight(50);
  }

  const fetchAutoConnectSetting = async () => {
    const setting = await AutoConnectStore.get();
    if (setting === undefined) setAutoConnectSetting(true);
    else setAutoConnectSetting(false);
  }


  // UPDATE SETTINGS
  const saveHeadlightData = async () => {
    await SleepyEyeStore.save("left", toUpdateLeft);
    await SleepyEyeStore.save("right", toUpdateRight);

    setToUpdateLeft(undefined);
    setToUpdateRight(undefined);
    await fetchHeadlightSettings();
  }

  const saveAutoConnect = async (value: boolean) => {

    setAutoConnectSetting(value);

    if (value) await AutoConnectStore.enable();
    else await AutoConnectStore.disable();

    await fetchAutoConnectSetting();
  }

  const resetHeadlightData = async () => {
    await SleepyEyeStore.save("left", undefined);
    await SleepyEyeStore.save("right", undefined);
    setToUpdateLeft(undefined);
    setToUpdateRight(undefined);
    await fetchHeadlightSettings();
  }

  const forgetPair = async () => {
    await DeviceMACStore.forgetMAC();
    await fetchPairing();
  }

  const deleteData = async () => {
    await CustomCommandStore.deleteAllCommands();
    await DeviceMACStore.forgetMAC();
    await SleepyEyeStore.save("left", undefined);
    await SleepyEyeStore.save("right", undefined);
    await AutoConnectStore.enable();

    await fetchPairing();
    await fetchHeadlightSettings();
    await fetchAutoConnectSetting();
  }

  useEffect(() => {
    (async () => {
      await fetchPairing();
      await fetchHeadlightSettings();
      await fetchAutoConnectSetting();
    })();
  }, [props.visible]);

  return (
    <>
      <Modal
        transparent={false}
        visible={props.visible}
        animationType="slide"
        hardwareAccelerated
      >
        <ScrollView style={{ backgroundColor: "rgb(20, 20, 20)", height: "100%", width: "100%" }} contentContainerStyle={{ display: "flex", alignItems: "center", justifyContent: "flex-start", rowGap: 20 }}>
          <Text style={{ ...styles.text, width: "90%", fontSize: 27, marginTop: 30 }}>Device Settings</Text>
          <View style={{ width: "90%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: 10, backgroundColor: "rgb(30, 30, 30)", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 5 }}>
            <Text style={{ textAlign: "center", color: "white", fontSize: 23, paddingHorizontal: 5 }}>
              {
                pairedMAC
                  ?
                  <>
                    <Text>Your paired Receiver ID is{"\n"}</Text>
                    <Text style={{ fontWeight: "bold", }}>{pairedMAC}{"\n\n"}</Text>
                    <Text style={{ fontSize: 16 }}>Forgetting your Wink Module will allow you to pair to a new device if needed.</Text>
                  </>
                  :
                  <>
                    <Text>No device paired.{"\n\n"}</Text>
                    <Text style={{ fontSize: 16 }}>If currently connected, the next time the app starts, you will automatically go through device pairing.</Text>
                  </>
              }
            </Text>
            {
              pairedMAC &&
              <OpacityButton
                text="Forget Device"
                buttonStyle={{ ...styles.button, width: 150, padding: 0, height: 40 }}
                onPress={() => forgetPair()}
                textStyle={{ fontSize: 17, color: "white" }}
              />
            }
          </View>

          <View style={{ width: "90%", rowGap: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 5, borderColor: "rgb(50, 50, 50)", borderWidth: 2 }}>
            <Text style={styles.text}>
              Auto Connect
            </Text>
            <Text style={{ color: "white", textAlign: "center" }}>
              When the controller app is opened, or when the 'Disconnect' button is pressed, the app will automatically connect/reconnect to the Wink Module.{"\n"}This is enabled by default.
            </Text>

            <Text style={{ fontSize: 20, color: autoConnectSetting ? "green" : "red", fontWeight: "bold" }}>
              Status: {autoConnectSetting ? "Enabled" : "Disabled"}
            </Text>

            <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
              <CheckBox
                size={25}
                fillColor="green"
                unFillColor="#FFFFFF"
                text="Enable"
                style={{ width: 110, flexDirection: "row-reverse" }}
                iconStyle={{ borderColor: "green" }}
                innerIconStyle={{ borderWidth: -2 }}
                textStyle={{ textDecorationLine: "none" }}
                isChecked={autoConnectSetting}
                onPress={() => saveAutoConnect(true)}
              />

              <CheckBox
                size={25}
                fillColor="red"
                unFillColor="#FFFFFF"
                text="Disable"
                iconStyle={{ borderColor: "red" }}
                style={{ width: 110 }}
                innerIconStyle={{ borderWidth: -2 }}
                isChecked={!autoConnectSetting}
                textStyle={{ textDecorationLine: "none" }}
                onPress={() => saveAutoConnect(false)}
              />
            </View>
          </View>

          <View style={{ width: "90%", display: "flex", alignItems: "center", justifyContent: "center", rowGap: 15, backgroundColor: "rgb(30, 30, 30)", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 5 }}>
            <Text style={styles.text}>Put Wink Module to Sleep</Text>
            <Text style={{ color: "white", textAlign: "center", fontSize: 13 }}>
              Putting your Wink Module to sleep can help preserve your cars battery life.{"\n"}
              While the module draws so little power, that it likely is not an issue, putting it to sleep can help if you don't plan to drive your car often, as it will draw even less power.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>You will be unable to connect to the Wink Module while it is sleep mode</Text>, but it will wake up after the timer expires.{"\n"}
              You can also wake the Wink Module up by pressing the popup button.
            </Text>
            <View style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-evenly", flexDirection: "row" }}>
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>
                Sleep for
              </Text>
              <InputSpinner
                min={0}
                width={120}
                height={30}
                // buttonStyle={{ width: 30, height: 30 }}
                background="rgb(40, 40, 40)"
                buttonStyle={{ backgroundColor: "#990033" }}

                onChange={(args) => console.log(args)}
              />

              {/* <Picker

              >
                {
                  ([
                    {
                      value: "seconds",
                      label: "Seconds",
                    },
                    {
                      value: "minutes",
                      label: "Minutes",
                    },
                    {
                      value: "hours",
                      label: "Hours"
                    },
                    {
                      value: "days",
                      label: "Days",
                    }
                  ] as PickerItemProps[]).map((val) => (
                    <Picker.Item
                      label={val.label}
                      value={val.value}
                    >

                    </Picker.Item>
                  ))
                }
              </Picker> */}
            </View>
            <OpacityButton
              buttonStyle={styles.button}
              onPress={() => { }}
              text="Put to Sleep"
              textStyle={styles.buttonText}

            />
          </View>

          <View style={{ width: "90%", rowGap: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 5, borderColor: "rgb(50, 50, 50)", borderWidth: 2 }}>
            <View>
              <Text style={styles.text}>
                Sleepy Eye Settings
              </Text>
              <Text style={{ color: "white", textAlign: "center" }}>
                Enter a number from 0 to 100. This will be used as a percentage from rest. Leaving them blank will default to 50%.
              </Text>
            </View>
            <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
              <View style={{ display: "flex", rowGap: 5, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "white", textAlign: "center", fontSize: 17, fontWeight: 500 }}>Left Headlight</Text>
                <Text style={{ color: "white" }}>Set to {leftHeadlight}%</Text>
                <TextInput
                  style={{ backgroundColor: "rgb(40, 40, 40)", paddingVertical: 5, paddingHorizontal: 15, color: "white", borderRadius: 3 }}
                  placeholder="0 to 100%"
                  placeholderTextColor="rgb(200,200,200)"
                  keyboardType="numeric"
                  value={toUpdateLeft?.toString() || ""}
                  onChangeText={(text) => {
                    if (parseInt(text) > 100) setToUpdateLeft(100);
                    else if (parseInt(text) < 0) setToUpdateLeft(0);
                    else if (text === "") setToUpdateLeft(undefined);
                    else setToUpdateLeft(parseFloat(text))
                  }}
                  maxLength={3}
                />
              </View>
              <View style={{ display: "flex", rowGap: 5, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "white", textAlign: "center", fontSize: 17, fontWeight: 500 }}>Right Headlight</Text>
                <Text style={{ color: "white" }}>Set to {rightHeadlight}%</Text>
                <TextInput
                  style={{ backgroundColor: "rgb(40, 40, 40)", paddingVertical: 5, paddingHorizontal: 15, color: "white", borderRadius: 3 }}
                  placeholder="0 to 100%"
                  placeholderTextColor="rgb(200,200,200)"
                  keyboardType="numeric"
                  value={toUpdateRight?.toString() || ""}
                  onChangeText={(text) => {
                    if (parseInt(text) > 100) setToUpdateRight(100);
                    else if (parseInt(text) < 0) setToUpdateRight(0);
                    else if (text === "") setToUpdateRight(undefined);
                    else setToUpdateRight(parseFloat(text))
                  }}
                  maxLength={3}
                />
              </View>
            </View>
            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%" }}>
              <OpacityButton
                text="Save"
                buttonStyle={{ ...styles.commandButton, backgroundColor: "#228B22", width: 85, height: 40, padding: 0 }}
                textStyle={styles.buttonText}
                onPress={() => saveHeadlightData()}
              />

              <OpacityButton
                text="Reset"
                buttonStyle={{ ...styles.commandButton, backgroundColor: "#990033", width: 85, height: 40, padding: 0 }}
                textStyle={styles.buttonText}
                onPress={() => resetHeadlightData()}
              />
            </View>
          </View>

          {/* TODO: TURN INTO MODAL */}
          <View style={{ width: "90%", display: "flex", alignItems: "center", justifyContent: "center", rowGap: 15, backgroundColor: "rgb(30, 30, 30)", paddingVertical: 20, paddingHorizontal: 10, borderRadius: 5 }}>
            <Text style={styles.text}>Delete all Data</Text>
            <Text style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>WARNING: This action is destructive and irreversible. All Custom Commands, device pairings, and stored data will be forgotten.</Text>
            <OpacityButton
              text="Delete"
              buttonStyle={{ ...styles.button, width: 150, backgroundColor: "#de142c" }}
              textStyle={{ ...styles.buttonText, fontWeight: "bold" }}
              onPress={() => setDeleteDataPopup(true)}
            />
          </View>

          <OpacityButton
            buttonStyle={{ ...styles.button, marginBottom: 30 }}
            textStyle={styles.buttonText}
            onPress={() => props.close()}
            text="Close"
          />
        </ScrollView>
      </Modal >

      <DeleteDataWarning
        visible={deleteDataPopup}
        close={() => setDeleteDataPopup(false)}
        delete={() => deleteData()}
        key={9999}
      />
    </>
  )

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(20, 20, 20)',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 25,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-evenly",
  },
  commandColumns: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  commandRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 10,
  },
  text: {
    color: "white",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
  },
  commandButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#990033",
    borderRadius: 5,
    padding: 10,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#990033",
    width: 200,
    height: 50,
    borderRadius: 5,
  },
  buttonDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "grey",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
  },
  input: {
    backgroundColor: "rgb(40, 40, 40)",
    padding: 10,
    color: "#ffffff",
    textAlign: "center",
    width: 200,
    borderRadius: 5,
  }
});