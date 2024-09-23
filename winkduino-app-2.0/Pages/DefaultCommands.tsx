import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { OpacityButton } from "../Components/OpacityButton";
import { SleepyEyeStore } from "../AsyncStorage";

type DefaultModalProps = {
  device: Device | null;
  visible: boolean;
  close: () => void;
  headlightsBusy: boolean;
  sendDefaultCommand: (value: number) => void;
  sendSleepCommand: (left: number, right: number) => void;
  sendSyncCommand: () => void;
  leftState: number;
  rightState: number;
}


const commands: { name: string, value: number }[][] = [
  [
    {
      name: "Left Up",
      value: 4,
    },
    {
      name: "Left Down",
      value: 5,
    },
    {
      name: "Left Wink",
      value: 6,
    }
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
    {
      name: "Both Blink",
      value: 3,
    }
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
    {
      name: "Right Wink",
      value: 9,
    }
  ]
];

function DefaultCommands(props: DefaultModalProps) {

  const [left, setLeft] = useState(50);
  const [right, setRight] = useState(50);

  const [needsReset, setNeedsReset] = useState(false);

  const fetchHeadlightSettings = async () => {
    const l = await SleepyEyeStore.get("left");
    const r = await SleepyEyeStore.get("right");

    if (l) setLeft(l);
    else setLeft(50);

    if (r) setRight(r);
    else setRight(50);
  }

  useEffect(() => {
    (async () => {
      fetchHeadlightSettings();
    })();
  }, [props.visible === true]);

  useEffect(() => {
    setNeedsReset((props.leftState !== Math.floor(props.leftState) || props.rightState != Math.floor(props.rightState)));
  }, [props.leftState, props.rightState]);


  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
      onRequestClose={() => props.close()}
    >
      <ScrollView style={styles.container} contentContainerStyle={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 25,
      }}>
        <Text style={{ color: "white", fontWeight: "bold", textAlign: "center", fontSize: 27, marginBottom: 10, marginTop: 20 }}>Default Commands</Text>
        <View style={styles.header}>
          <Text style={styles.text}>Left State: {props.leftState}</Text>
          <Text style={styles.text}>Right State: {props.rightState}</Text>
        </View>


        <View style={styles.commandColumns} >
          {
            commands.map((part, i) => (
              <View style={styles.commandRow} key={i}>
                {
                  part.map((cmd, i) => (
                    <OpacityButton
                      onPress={() => props.sendDefaultCommand(cmd.value)}
                      disabled={props.headlightsBusy || needsReset}
                      buttonStyle={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton}
                      textStyle={styles.buttonText}
                      text={cmd.name}
                    />
                  ))
                }
              </View>
            ))
          }
        </View>

        <View style={{ display: "flex", width: "90%", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: 5, paddingVertical: 15, borderRadius: 5, borderColor: "rgb(50, 50, 50)", borderWidth: 2 }}>
          <Text style={styles.text}>Wave Commands</Text>
          <Text style={{ color: "white", textAlign: "center", width: "90%" }}>
            Wave commands start from the specified headlight, and wink from the start headlight to the other  one.
          </Text>
          <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
            <OpacityButton
              disabled={props.headlightsBusy || needsReset}
              buttonStyle={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton}
              onPress={() => props.sendDefaultCommand(10)}
              text="Left Wave"
              textStyle={styles.buttonText}
            />

            <OpacityButton
              disabled={props.headlightsBusy || needsReset}
              buttonStyle={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton}
              onPress={() => props.sendDefaultCommand(11)}
              text="Right Wave"
              textStyle={styles.buttonText}
            />
          </View>
        </View>

        <View style={{ width: "90%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: 10, backgroundColor: "rgb(30, 30, 30)", borderRadius: 5, paddingVertical: 20, }}>
          {/* TEXT DESCRIBING */}
          <Text style={styles.text}>Sleepy Eyes</Text>
          <Text style={{ color: "white" }}>
            You can update Sleepy Eye settings from the settings page
          </Text>
          <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%" }}>
            <Text style={{ color: "white" }}>Left setting: {left}%</Text>
            <Text style={{ color: "white" }}>Right setting: {right}%</Text>
          </View>
          {/* TODO: Use settings page values for sleepy eye */}
          {/* UPDATE THIS CODE TO USE SETTINGS AND NOT INPUT ABOVE */}


          <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
            <OpacityButton
              onPress={() => props.sendSleepCommand(left, right)}
              disabled={props.headlightsBusy || needsReset}
              buttonStyle={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton}
              textStyle={styles.buttonText}
              text="Send Sleepy Eye"
            />
            <OpacityButton
              onPress={() => props.sendSyncCommand()}
              disabled={props.headlightsBusy}
              buttonStyle={props.headlightsBusy ? styles.buttonDisabled : styles.commandButton}
              textStyle={styles.buttonText}
              text="Reset"
            />
          </View>
        </View>

        <OpacityButton
          onPress={() => props.close()}
          buttonStyle={{ marginTop: 10, marginBottom: 20, ...styles.button }}
          textStyle={styles.buttonText}
          text="Close"
        />
      </ScrollView>
    </Modal >
  )
}

const styles = StyleSheet.create({
  container: {

    backgroundColor: 'rgb(20, 20, 20)',

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
    width: "90%",
    backgroundColor: "rgb(30, 30, 30)",
    paddingVertical: 20,
    borderRadius: 5,
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
    fontSize: 20,
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
  sleepInput: {
    backgroundColor: "rgb(40, 40, 40)",
    padding: 10,
    color: "#ffffff",
    textAlign: "center",
    width: 200,
    borderRadius: 5,
  }
});

export { DefaultCommands };