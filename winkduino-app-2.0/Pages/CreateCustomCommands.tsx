import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { CommandInput, CommandOutput, CustomCommandStore } from "../AsyncStorage/CustomCommandStore";
import { useEffect, useState } from "react";
import { OpacityButton } from "../Components/OpacityButton";
import { defaults } from "../hooks/useColorTheme";

type CreateCustomCommandProps = {
  visible: boolean;
  device: Device | null;
  close: () => void;
  colorTheme: typeof defaults;
}

type CommandInputWithName = CommandInput & { name: string };

export function CreateCustomCommands(props: CreateCustomCommandProps) {

  const [commandName, setCommandName] = useState("");
  const [delayMS, setDelayMS] = useState(0);
  const [commandSequence, setCommandSequence] = useState([] as CommandInputWithName[]);

  const [allCommands, setAllCommands] = useState([] as CommandOutput[]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createError = (err: string, ms: number) => {
    setError(err);
    setTimeout(() => setError(""), ms);
  }

  const createSuccess = (msg: string, ms: number) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), ms);
  }

  const fetchAllCommands = async () => {
    try {
      const allCommands = await CustomCommandStore.getAllCommands();
      setAllCommands(allCommands);
    } catch (err) {
      createError("Something went wrong while getting all commands", 10000);
    }
  }

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

  const saveCommand = async () => {
    if (commandName === "") return createError("Please enter a preset name", 5000);
    if (commandSequence.length < 1) return createError("Use at least one command", 5000);
    try {
      const returnValue = await CustomCommandStore.saveCommand(commandName, commandSequence);
      if (returnValue === false) return createError(`Preset with name '${commandName}' already exists`, 5000);
      else createSuccess("Successfully saved command", 7500);
      await fetchAllCommands();
      setCommandName("");
      setCommandSequence([]);
    } catch (err) {

    }
  }


  const deleteCommand = async (commandName: string) => {
    try {
      const returnVal = await CustomCommandStore.deleteCommand(commandName);
      if (returnVal) createSuccess("Successfully deleted command", 7500);
      await fetchAllCommands();
    } catch (err) {

    }
  }

  useEffect(() => {
    (async () => {
      await fetchAllCommands();
    })();
  }, []);

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
        style={{
          backgroundColor: props.colorTheme.backgroundPrimaryColor,
          height: "100%",
          width: "100%"
        }}
        contentContainerStyle={{ display: "flex", alignItems: "center", justifyContent: "flex-start", rowGap: 20 }}>
        {
          success ?
            <Text style={{ marginTop: 20, textAlign: "center", color: "lightgreen", fontSize: 30 }}>
              {success}
            </Text> :
            <Text style={{ marginTop: 20, textAlign: "center", color: error ? "red" : "lightgreen", fontSize: 30 }}>
              {error ? `${error}` : "Editing Command"}
            </Text>
        }
        <TextInput
          style={{ ...styles.input, fontSize: 18, width: 300, backgroundColor: props.colorTheme.backgroundSecondaryColor }}
          value={commandName}
          onChangeText={setCommandName}
          placeholderTextColor={"rgb(200,200,200)"}
          placeholder="Enter Command Name"
        />

        <View
          style={{
            width: "90%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 5,
            borderRadius: 5,
            borderColor: props.colorTheme.backgroundSecondaryColor,
            borderWidth: 2
          }}>
          <Text style={{ ...styles.text, fontSize: 23, color: props.colorTheme.headerTextColor }}>
            Command Sequence
          </Text>
          <Text style={{ color: props.colorTheme.textColor, textAlign: "center", padding: 5 }}>
            {
              commandSequence.length >= 1 ?
                commandSequence.map((cmd, i) => (
                  <Text>{cmd.isDelay ? `Delay ${cmd.delay}ms` : cmd.name}{i === commandSequence.length - 1 ? "" : " --> "}</Text>
                ))
                : "No commands entered"
            }
          </Text>
        </View>

        <View
          style={{
            width: "90%",
            display: "flex",
            flexDirection: "column",
            rowGap: 10,
            backgroundColor: props.colorTheme.backgroundSecondaryColor,
            paddingVertical: 15,
            borderRadius: 5
          }}>
          <Text style={{ color: props.colorTheme.headerTextColor, textAlign: "center", fontSize: 30 }}>Default Palette</Text>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              width: "100%"
            }}>
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
                      <OpacityButton
                        text={cmd.title}
                        textStyle={{ ...styles.buttonText, fontSize: 16, color: props.colorTheme.buttonTextColor }}
                        buttonStyle={{ ...styles.button, width: "auto", paddingHorizontal: 15, backgroundColor: props.colorTheme.buttonColor }}
                        onPress={() => setCommandSequence((prev) => [...prev, { isDelay: false, transmitValue: cmd.i, name: cmd.title }])}
                      />
                    ))
                  }
                </View>
              ))
            }
          </View>
        </View>

        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            rowGap: 10,
            padding: 15,
            borderRadius: 5,
            borderColor: props.colorTheme.backgroundSecondaryColor,
            borderWidth: 2
          }}>
          <Text style={{ color: props.colorTheme.headerTextColor, textAlign: "center", fontSize: 30 }}>Add Delay</Text>
          <Text style={{ color: props.colorTheme.textColor, textAlign: "center", maxWidth: "90%" }}>Adds delay between command signals. There will already be a small amount of delay between commands by default, due to the headlights movement.</Text>
          <TextInput
            value={delayMS === 0 ? "" : delayMS.toString()}
            onChangeText={(text) => text === "" ? setDelayMS(0) : setDelayMS(parseFloat(text))}
            keyboardType="number-pad"
            style={{ ...styles.input, width: 300, backgroundColor: props.colorTheme.backgroundSecondaryColor }}
            placeholder="Delay in milliseconds"
            placeholderTextColor="rgb(200,200,200)"
          />
          <OpacityButton
            buttonStyle={{ ...styles.button, backgroundColor: props.colorTheme.buttonColor }}
            textStyle={{ ...styles.buttonText, color: props.colorTheme.buttonTextColor }}
            text="Add Delay"
            onPress={() => setCommandSequence((prev) => [...prev, { isDelay: true, delay: delayMS, name: "", transmitValue: -1 }])}
          />
        </View>


        <View
          style={{
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            rowGap: 10,
            backgroundColor: props.colorTheme.backgroundSecondaryColor,
            borderRadius: 5,
            padding: 15
          }}>
          <Text style={{ color: props.colorTheme.headerTextColor, textAlign: "center", fontSize: 30 }} >Saved Presets</Text>
          <Text style={{ color: props.colorTheme.textColor, textAlign: "center" }}>Usable from the Presets Menu</Text>
          <ScrollView horizontal contentContainerStyle={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", columnGap: 20 }} style={{ width: "100%", columnGap: 10, rowGap: 10 }}>
            {
              allCommands.length > 0 ?
                allCommands.map((cmd, i) => (
                  <View style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 5,
                    backgroundColor: i % 2 === 0 ? "rgb(37, 37, 37)" : "transparent",
                    borderColor: i % 2 === 1 ? "rgb(40, 40, 40)" : "none",
                    borderWidth: i % 2 === 1 ? 3 : 0,
                    padding: 15,
                    paddingHorizontal: 10,
                    rowGap: 5,
                    width: 200,
                    height: 160
                  }}>
                    <Text style={{ color: props.colorTheme.headerTextColor, fontWeight: "bold", fontSize: 20 }}>{cmd.name}</Text>
                    <ScrollView
                      contentContainerStyle={{ width: "100%", height: "100%", display: 'flex', flexDirection: "column" }}
                      style={{ width: "100%", height: "100%" }}
                    // horizontal
                    >
                      <Text style={{ color: props.colorTheme.textColor, textAlign: "left" }}>
                        {cmd.command.split("-").map(part => parseCommandPartHumanReadable(part)).join(" → ")}
                      </Text>
                    </ScrollView>
                    <OpacityButton
                      buttonStyle={{ backgroundColor: props.colorTheme.buttonColor, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 }}
                      textStyle={{ fontSize: 16, color: props.colorTheme.buttonTextColor }}
                      text="Delete Command"
                      onPress={() => deleteCommand(cmd.name)}
                    />
                  </View>
                ))
                : <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>No Commands Found</Text>
            }
          </ScrollView>
        </View>






        <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
          <OpacityButton
            buttonStyle={{ ...styles.button, backgroundColor: "#228B22", width: 150 }}
            textStyle={{ ...styles.buttonText, fontSize: 18 }}
            text="Save Command"
            onPress={() => saveCommand()}
          />
          <OpacityButton
            buttonStyle={{ ...styles.button, backgroundColor: "#de142c", width: 150 }}
            textStyle={{ ...styles.buttonText, fontSize: 18, textAlign: "center" }}
            text="Remove Last Instruction"
            onPress={() => setCommandSequence((prev) => prev.slice(0, prev.length - 1))}
          />
        </View>

        <OpacityButton
          buttonStyle={{ ...styles.button, marginBottom: 10, backgroundColor: props.colorTheme.buttonColor }}
          textStyle={{ ...styles.buttonText, color: props.colorTheme.buttonTextColor }}
          text="Close"
          onPress={() => props.close()}
        />
      </ScrollView>

    </Modal >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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