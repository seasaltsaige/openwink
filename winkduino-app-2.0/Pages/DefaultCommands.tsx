import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";

type DefaultModalProps = {
  device: Device | null;
  visible: boolean;
  close: () => void;
  headlightsBusy: boolean;
  sendDefaultCommand: (value: number) => void;
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

  return (
    <Modal
      transparent={false}
      visible={props.visible}
      animationType="fade"
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
                    <TouchableOpacity disabled={props.headlightsBusy} style={props.headlightsBusy ? styles.buttonDisabled : styles.commandButton}>
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



        <TouchableOpacity onPress={() => props.close()} style={styles.button}>
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
    width: 200,
    height: 50,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
  }
});

export { DefaultCommands };