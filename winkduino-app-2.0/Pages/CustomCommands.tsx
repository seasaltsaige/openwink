import { Modal, StyleSheet, Text, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { CommandOutput, CustomCommandStore } from "../AsyncStorage/CustomCommandStore";
import { useEffect, useState } from "react";
import base64 from "react-native-base64";
import { useBLE } from "../hooks/useBLE";
import { OpacityButton } from "../Components/OpacityButton";

type CustomCommandProps = {
  visible: boolean;
  device: Device | null;
  close: () => void;
  sendDefaultCommand: (value: number) => void;
  headlightBusy: boolean;
  leftStatus: number;
  rightStatus: number;
}
const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const BUSY_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51521";
const HEADLIGHT_MOVEMENT_DELAY = 750;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function CustomCommands(props: CustomCommandProps) {

  const { setHeadlightsBusy } = useBLE();

  const [allCustomCommands, setAllCustomCommands] = useState([] as CommandOutput[]);

  const executeCommand = async (commandSequence: string) => {
    const parts = commandSequence.split("-");

    for (const cmd of parts) {
      while (props.headlightBusy) { };
      if (cmd.includes("d")) {
        const delay = parseFloat(cmd.slice(1, cmd.length));
        await sleep(delay);
      } else {
        props.sendDefaultCommand(parseInt(cmd));
        if (cmd === "3" || cmd === "6" || cmd === "9") await sleep(HEADLIGHT_MOVEMENT_DELAY * 2)
        else if (cmd === "10" || cmd === "11")
          await sleep(HEADLIGHT_MOVEMENT_DELAY * 4);
        else await sleep(HEADLIGHT_MOVEMENT_DELAY);
      }
    }

    const res = await props.device?.readCharacteristicForService(SERVICE_UUID, BUSY_CHAR_UUID);
    if (base64.decode(res?.value!) === "0") setHeadlightsBusy(false);
    else setHeadlightsBusy(true);

    console.log(parts);
  }

  const fetchAllCommands = async () => {
    const cmds = await CustomCommandStore.getAllCommands();
    setAllCustomCommands(cmds);
  }

  useEffect(() => {
    (async () => {
      await fetchAllCommands();
    })();
  }, []);

  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
    >

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.text}>Left State: {props.leftStatus}</Text>
          <Text style={styles.text}>Right State: {props.rightStatus}</Text>
        </View>

        <OpacityButton
          onPress={() => fetchAllCommands()}
          buttonStyle={{ backgroundColor: "rgb(30,30,30)", padding: 10, borderRadius: 4 }}
          textStyle={{ color: "white" }}
          text="Refresh Commands"
        />

        <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", flexWrap: "wrap", columnGap: 3, rowGap: 5 }}>
          {
            allCustomCommands.map((cmd, i) => (
              <View style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", rowGap: 3, backgroundColor: i % 2 === 0 ? "rgb(15, 15, 15)" : "rgb(30, 30, 30)" }}>
                <Text style={styles.text}>{cmd.name}</Text>
                <Text style={{ ...styles.text, fontWeight: "light", fontSize: 15 }}>{cmd.command}</Text>

                <OpacityButton
                  disabled={props.headlightBusy}
                  buttonStyle={{ ...(props.headlightBusy ? styles.buttonDisabled : styles.button), width: "auto", height: "auto", padding: 10, }}
                  textStyle={{ fontSize: 16, textAlign: "center", color: "white" }}
                  text="Execute Command"
                  onPress={() => executeCommand(cmd.command)}
                />
              </View>
            ))
          }
        </View>


        <OpacityButton
          buttonStyle={{ ...styles.button, marginBottom: 10 }}
          textStyle={styles.buttonText}
          onPress={() => props.close()}
          text="Close"
        />
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