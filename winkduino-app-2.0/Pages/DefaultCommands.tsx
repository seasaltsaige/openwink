import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { OpacityButton } from "../Components/OpacityButton";

type DefaultModalProps = {
  device: Device | null;
  visible: boolean;
  close: () => void;
  headlightsBusy: boolean;
  sendDefaultCommand: (value: number) => void;
  sendSleepCommand: (value: number) => void;
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

  const [sleepyEyeValue, setSleepyEyeValue] = useState("");
  const [needsReset, setNeedsReset] = useState(false);



  useEffect(() => {
    setNeedsReset((props.leftState !== Math.floor(props.leftState) || props.rightState != Math.floor(props.rightState)));
  }, [props.leftState, props.rightState]);

  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
    >
      <View style={styles.container}>
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

        <Text style={{ color: "white", fontSize: 16, textAlign: "center", marginLeft: 5, marginRight: 5, }}>
          1-100 represents percentages from fully closed. 1 being 1% above, and 100 being 100% fully open.
        </Text>
        <TextInput placeholderTextColor={"rgb(200, 200, 200)"} placeholder="Enter a number from 1-100" value={sleepyEyeValue} maxLength={3} keyboardType="number-pad" onChangeText={(text) => parseInt(text) > 100 ? setSleepyEyeValue("100") : setSleepyEyeValue(text)} style={styles.sleepInput} />

        {/* TODO: Use settings page values for sleepy eye */}
        <OpacityButton
          onPress={() => props.sendSleepCommand(parseInt(sleepyEyeValue))}
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
          text="Sync Headlights (Resets Sleepy Eye)"
        />

        <OpacityButton
          onPress={() => props.close()}
          buttonStyle={{ marginTop: 20, ...styles.button }}
          textStyle={styles.buttonText}
          text="Close"
        />
      </View>
    </Modal >
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
    fontSize: 20,
    fontWeight: "bold"
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