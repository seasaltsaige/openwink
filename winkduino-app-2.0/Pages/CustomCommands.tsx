import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { CommandOutput, CustomCommandStore } from "../AsyncStorage/CustomCommandStore";
import { useEffect, useState } from "react";
import base64 from "react-native-base64";
import { useBLE } from "../hooks/useBLE";
import { OpacityButton } from "../Components/OpacityButton";
import { defaults } from "../hooks/useColorTheme";

type CustomCommandProps = {
  visible: boolean;
  device: Device | null;
  close: () => void;
  sendDefaultCommand: (value: number) => void;
  headlightBusy: boolean;
  leftStatus: number;
  rightStatus: number;
  colorTheme: typeof defaults;
}
const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const BUSY_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51521";
const HEADLIGHT_MOVEMENT_DELAY = 750;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const commands: { name: string, value: number }[] = [
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
  },
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
  },
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
  },
  {
    name: "Left Wave",
    value: 10,
  },
  {
    name: "Right Wave",
    value: 11,
  }

];


const parseCommandPartHumanReadable = (part: string) => {
  if (part.includes("d")) {
    part = part.slice(1);
    const ms = parseFloat(part);
    return `Delay ${ms}ms`;
  } else {
    const commandVal = parseInt(part);
    const cmd = commands.find(c => c.value === commandVal);
    return cmd?.name;
  }
}

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
  }

  const fetchAllCommands = async () => {
    const cmds = await CustomCommandStore.getAllCommands();
    setAllCustomCommands(cmds);
  }

  useEffect(() => {
    (async () => {
      await fetchAllCommands();
    })();
  }, [props.visible]);

  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
      onRequestClose={() => props.close()}
    >
      <ScrollView
        contentContainerStyle={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 20
        }}
        style={{
          backgroundColor: props.colorTheme.backgroundPrimaryColor,
          height: "100%",
          width: "100%"
        }}>

        <Text
          style={{
            color: props.colorTheme.headerTextColor,
            fontWeight: "bold",
            fontSize: 30,
            marginTop: 20,
            width: "90%",
            textAlign: "center"
          }}>
          Custom Command Pallet
        </Text>

        <View style={styles.header}>
          <Text style={{ ...styles.text, color: props.colorTheme.textColor }}>Left | {props.leftStatus === 0 ? "Down" : props.leftStatus === 1 ? "Up" : `${props.leftStatus}%`}</Text>
          <Text style={{ ...styles.text, color: props.colorTheme.textColor }}>Right | {props.rightStatus === 0 ? "Down" : props.rightStatus === 1 ? "Up" : `${props.rightStatus}%`}</Text>
        </View>

        <View style={{ width: "90%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", rowGap: 20 }}>
          {
            allCustomCommands.map((cmd, i) => (
              <View style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 5,
                backgroundColor: i % 2 === 0 ? props.colorTheme.backgroundSecondaryColor : "transparent",
                borderColor: i % 2 === 1 ? props.colorTheme.backgroundSecondaryColor : "none",
                borderWidth: i % 2 === 1 ? 3 : 0,
                padding: 15,
                paddingHorizontal: 10,
                rowGap: 7,
                width: 300,
              }}>
                <Text style={{ ...styles.text, color: props.colorTheme.headerTextColor }}>{cmd.name}</Text>
                <Text style={{ ...styles.text, fontWeight: "light", fontSize: 15, color: props.colorTheme.headerTextColor }}>{cmd.command.split("-").map((v) => parseCommandPartHumanReadable(v)).join(" --> ")}</Text>

                <OpacityButton
                  disabled={props.headlightBusy}
                  buttonStyle={{
                    ...(props.headlightBusy ?
                      { ...styles.buttonDisabled, backgroundColor: props.colorTheme.disabledButtonColor } :
                      { ...styles.button, backgroundColor: props.colorTheme.buttonColor }
                    ), width: "auto", height: "auto", padding: 10,
                  }}
                  textStyle={{ fontSize: 16, textAlign: "center", color: props.headlightBusy ? props.colorTheme.disabledButtonTextColor : props.colorTheme.buttonTextColor }}
                  text="Execute Command"
                  onPress={() => executeCommand(cmd.command)}
                />
              </View>
            ))
          }
        </View>


        <OpacityButton
          buttonStyle={{ ...styles.button, marginBottom: 10, backgroundColor: props.colorTheme.buttonColor }}
          textStyle={{ ...styles.buttonText, color: props.colorTheme.buttonTextColor }}
          onPress={() => props.close()}
          text="Close"
        />
      </ScrollView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(20, 20, 20)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    rowGap: 25,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
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