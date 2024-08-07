import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";

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
                    <TouchableOpacity disabled={props.headlightsBusy || needsReset} style={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton}>
                      <Text onPress={() => props.sendDefaultCommand(cmd.value)} style={styles.buttonText}>
                        {cmd.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                }
              </View>
            ))
          }
        </View>

        <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
          <TouchableOpacity disabled={props.headlightsBusy || needsReset} style={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton} onPress={() => props.sendDefaultCommand(10)}>
            <Text style={styles.buttonText}>
              Left Wave
            </Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={props.headlightsBusy || needsReset} style={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton} onPress={() => props.sendDefaultCommand(11)}>
            <Text style={styles.buttonText}>
              Right Wave
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: "white", fontSize: 16, textAlign: "center", marginLeft: 5, marginRight: 5, }}>
          1-100 represents percentages from fully closed. 1 being 1% above, and 100 being 100% fully open.
        </Text>
        <TextInput placeholderTextColor={"rgb(200, 200, 200)"} placeholder="Enter a number from 1-100" value={sleepyEyeValue} maxLength={3} keyboardType="number-pad" onChangeText={(text) => parseInt(text) > 100 ? setSleepyEyeValue("100") : setSleepyEyeValue(text)} style={styles.sleepInput} />
        <TouchableOpacity onPress={() => props.sendSleepCommand(parseInt(sleepyEyeValue))} disabled={props.headlightsBusy || needsReset} style={(props.headlightsBusy || needsReset) ? styles.buttonDisabled : styles.commandButton}>
          <Text style={styles.buttonText}>
            Send Sleepy Eye
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => props.sendSyncCommand()} disabled={props.headlightsBusy} style={props.headlightsBusy ? styles.buttonDisabled : styles.commandButton}>
          <Text style={styles.buttonText}>
            Sync Headlights (Reset Sleepy Eye)
          </Text>
        </TouchableOpacity>


        <TouchableOpacity onPress={() => props.close()} style={{ marginTop: 20, ...styles.button }}>
          <Text style={styles.buttonText}>
            Close
          </Text>
        </TouchableOpacity>

      </View>
    </Modal>
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