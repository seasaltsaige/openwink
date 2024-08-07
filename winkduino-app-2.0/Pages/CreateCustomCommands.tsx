import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { CommandInput, CommandOutput, CustomCommandStore } from "../AsyncStorage/AsyncStorage";
import { useEffect, useState } from "react";

type CreateCustomCommandProps = {
  visible: boolean;
  device: Device | null;
  close: () => void;
}

type CommandInputWithName = CommandInput & { name: string };

export function CreateCustomCommands(props: CreateCustomCommandProps) {

  const [commandName, setCommandName] = useState("");
  const [delayMS, setDelayMS] = useState(0);
  const [commandSequence, setCommandSequence] = useState([] as CommandInputWithName[]);

  const [allCommands, setAllCommands] = useState([] as CommandOutput[]);

  const [error, setError] = useState("");

  const createError = (err: string, ms: number) => {
    setError(err);
    setTimeout(() => {
      setError("");
    }, ms);
  }

  const saveCommand = async () => {
    if (commandName === "") return createError("Please enter a preset name", 5000);
    if (commandSequence.length < 1) return createError("Use at least one command", 5000);
    try {
      const returnValue = await CustomCommandStore.saveCommand(commandName, commandSequence);
      if (returnValue === false) return createError(`Preset with name '${commandName}' already exists`, 5000);

    } catch (err) {

    }
  }


  const deleteCommand = (commandName: string) => {

  }


  useEffect(() => {
    (async () => {
      try {
        const allCommands = await CustomCommandStore.getAllCommands();
        setAllCommands(allCommands);
      } catch (err) {
        createError("Something went wrong while getting all commands", 10000);
      }
    })();
  }, []);

  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
    >

      <ScrollView style={{ backgroundColor: "rgb(20, 20, 20)", height: "100%", width: "100%" }} contentContainerStyle={{ display: "flex", alignItems: "center", justifyContent: "flex-start", rowGap: 20 }}>
        <Text style={{ color: error ? "red" : "lightgreen", fontSize: 30 }}>{error ? `${error}` : "Editing Command"}</Text>

        <TextInput
          style={{ ...styles.input, fontSize: 18, width: 300 }}
          value={commandName}
          onChangeText={setCommandName}
          placeholderTextColor={"rgb(200,200,200)"}
          placeholder="Enter Command Name"
        />

        <View style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ ...styles.text, fontSize: 23 }}>
            Command Sequece
          </Text>
          <Text style={{ color: "white", textAlign: "center" }}>
            {commandSequence.map((cmd, i) => (
              <Text>{cmd.name}{i === commandSequence.length - 1 ? "" : " --> "}</Text>
            ))}
          </Text>
        </View>

        <Text style={styles.text}>Default Command Palette</Text>
        <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%" }}>
          {
            [
              [
                { title: "Left Up", i: 4 },
                { title: "Left Down", i: 5 },
                { title: "Left Wink", i: 6 },
                { title: "Left Wave", i: 10 },
              ], [
                { title: "Both Up", i: 1 },
                { title: "Both Down", i: 2 },
                { title: "Both Blink", i: 3 },
              ], [
                { title: "Right Up", i: 7 },
                { title: "Right Down", i: 8 },
                { title: "Right Wink", i: 9 },
                { title: "Right Wave", i: 11 },
              ]
            ].map((part) => (
              <View style={{ display: "flex", flexDirection: "column", alignItems: "center", rowGap: 8, }}>
                {
                  part.map(cmd => (
                    <TouchableOpacity onPress={() => setCommandSequence((prev) => [...prev, { isDelay: false, transmitValue: cmd.i, name: cmd.title }])} style={{ ...styles.button, width: "auto", paddingHorizontal: 15 }}>
                      <Text style={{ ...styles.buttonText, fontSize: 16 }}>
                        {
                          cmd.title
                        }
                      </Text>
                    </TouchableOpacity>
                  ))
                }
              </View>
            ))
          }
        </View>


        <View style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "white", textAlign: "center", fontSize: 30 }}>Add Delay</Text>
          <Text style={{ color: "white", textAlign: "center" }}>Adds delay between command signals. There will already be a small amount of delay between commands by default, due to the headlights movement.</Text>
          <TextInput
            value={delayMS === 0 ? "" : delayMS.toString()}
            onChangeText={(text) => text === "" ? setDelayMS(0) : setDelayMS(parseFloat(text))}
            keyboardType="number-pad"
            style={{ ...styles.input, width: 300 }}
            placeholder="Delay in milliseconds"
            placeholderTextColor="rgb(200,200,200)"
          />
        </View>


        <View style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Text style={{ color: "white", textAlign: "center", fontSize: 30 }} >Custom Presets</Text>
          <Text style={{ color: "white", textAlign: "center" }}>Usable from the Presets Menu</Text>
          <View style={{ width: "100%", margin: 5, display: "flex", alignItems: "center", justifyContent: "space-evenly", flexWrap: "wrap" }}>
            {
              allCommands.map(cmd => (
                <View>
                  <Text>{cmd.name}</Text>
                  <Text>{cmd.command}</Text>
                </View>
              ))
            }
          </View>
        </View>






        <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
          <TouchableOpacity style={{ ...styles.button, backgroundColor: "darkgreen", width: 150 }}>
            <Text style={{ ...styles.buttonText, fontSize: 18 }} onPress={() => saveCommand()}>
              Save Command
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ ...styles.button, backgroundColor: "red", width: 150 }}>
            <Text style={{ ...styles.buttonText, fontSize: 18, textAlign: "center" }} onPress={() => setCommandSequence((prev) => prev.slice(0, prev.length - 1))}>
              Remove Last Instruction
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText} onPress={() => props.close()}>
            Close
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
  input: {
    backgroundColor: "rgb(40, 40, 40)",
    padding: 10,
    color: "#ffffff",
    textAlign: "center",
    width: 200,
    borderRadius: 5,
  }
});