import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { OpacityButton } from "../Components/OpacityButton";
import { SleepyEyeStore } from "../AsyncStorage";
import { defaults, useColorTheme } from "../hooks/useColorTheme";

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
  colorTheme: typeof defaults;
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
      <ScrollView style={{ backgroundColor: props.colorTheme.backgroundPrimaryColor }} contentContainerStyle={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 25,
      }}>
        <Text style={{
          color: props.colorTheme.headerTextColor,
          fontWeight: "bold",
          textAlign: "center",
          fontSize: 27,
          marginBottom: 10,
          marginTop: 20
        }}>
          Default Commands
        </Text>
        <View style={styles.header}>
          <Text style={{ ...styles.text, color: props.colorTheme.textColor }}>Left | {props.leftState === 0 ? "Down" : props.leftState === 1 ? "Up" : `${props.leftState}%`}</Text>
          <Text style={{ ...styles.text, color: props.colorTheme.textColor }}>Right | {props.rightState === 0 ? "Down" : props.rightState === 1 ? "Up" : `${props.rightState}%`}</Text>
        </View>


        <View style={{ ...styles.commandColumns, backgroundColor: props.colorTheme.backgroundSecondaryColor }} >
          {
            commands.map((part, i) => (
              <View style={styles.commandRow} key={i}>
                {
                  part.map((cmd, i) => (
                    <OpacityButton
                      onPress={() => props.sendDefaultCommand(cmd.value)}
                      disabled={props.headlightsBusy || needsReset}
                      buttonStyle={
                        (props.headlightsBusy || needsReset) ?
                          {
                            ...styles.buttonDisabled,
                            backgroundColor: props.colorTheme.disabledButtonColor
                          } :
                          {
                            ...styles.commandButton,
                            backgroundColor: props.colorTheme.buttonColor
                          }
                      }
                      textStyle={
                        (props.headlightsBusy || needsReset) ?
                          {
                            ...styles.buttonText,
                            color: props.colorTheme.disabledButtonTextColor
                          } :
                          {
                            ...styles.buttonText,
                            color: props.colorTheme.buttonTextColor
                          }
                      }
                      text={cmd.name}
                    />
                  ))
                }
              </View>
            ))
          }
        </View>

        <View style={{
          display: "flex",
          width: "90%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 5,
          paddingVertical: 15,
          borderRadius: 5,
          borderColor: props.colorTheme.backgroundSecondaryColor,
          borderWidth: 2
        }}>
          <Text style={{ ...styles.text, color: props.colorTheme.headerTextColor }}>Wave Commands</Text>
          <Text style={{ color: props.colorTheme.textColor, textAlign: "center", width: "90%" }}>
            Wave commands start from the specified headlight, and wink from the start headlight to the other one.
          </Text>
          <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>

            <OpacityButton
              disabled={props.headlightsBusy || needsReset}
              buttonStyle={
                (props.headlightsBusy || needsReset) ?
                  {
                    ...styles.buttonDisabled,
                    backgroundColor: props.colorTheme.disabledButtonColor
                  } :
                  {
                    ...styles.commandButton,
                    backgroundColor: props.colorTheme.buttonColor
                  }
              }
              onPress={() => props.sendDefaultCommand(10)}
              text="Left Wave"
              textStyle={(props.headlightsBusy || needsReset) ?
                {
                  ...styles.buttonText,
                  color: props.colorTheme.disabledButtonTextColor
                } :
                {
                  ...styles.buttonText,
                  color: props.colorTheme.buttonTextColor
                }
              }
            />

            <OpacityButton
              disabled={props.headlightsBusy || needsReset}
              buttonStyle={
                (props.headlightsBusy || needsReset) ?
                  {
                    ...styles.buttonDisabled,
                    backgroundColor: props.colorTheme.disabledButtonColor
                  } :
                  {
                    ...styles.commandButton,
                    backgroundColor: props.colorTheme.buttonColor
                  }
              }
              onPress={() => props.sendDefaultCommand(11)}
              text="Right Wave"
              textStyle={(props.headlightsBusy || needsReset) ?
                {
                  ...styles.buttonText,
                  color: props.colorTheme.disabledButtonTextColor
                } :
                {
                  ...styles.buttonText,
                  color: props.colorTheme.buttonTextColor
                }
              }
            />
          </View>
        </View>

        <View style={{
          width: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          backgroundColor: props.colorTheme.backgroundSecondaryColor,
          borderRadius: 5,
          paddingVertical: 20,
        }}>

          <Text style={{
            ...styles.text,
            color: props.colorTheme.headerTextColor
          }}>
            Sleepy Eyes
          </Text>

          <Text style={{
            color: props.colorTheme.textColor
          }}>
            You can update Sleepy Eye settings from the settings page
          </Text>

          <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%" }}>
            <Text style={{ color: props.colorTheme.textColor }}>Left setting: {left}%</Text>
            <Text style={{ color: props.colorTheme.textColor }}>Right setting: {right}%</Text>
          </View>

          <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
            <OpacityButton
              onPress={() => props.sendSleepCommand(left, right)}
              disabled={props.headlightsBusy || needsReset}
              buttonStyle={
                (props.headlightsBusy || needsReset) ?
                  {
                    ...styles.buttonDisabled,
                    backgroundColor: props.colorTheme.disabledButtonColor
                  } :
                  {
                    ...styles.commandButton,
                    backgroundColor: props.colorTheme.buttonColor
                  }
              }
              textStyle={
                (props.headlightsBusy || needsReset) ?
                  {
                    ...styles.buttonText,
                    color: props.colorTheme.disabledButtonTextColor
                  } :
                  {
                    ...styles.buttonText,
                    color: props.colorTheme.buttonTextColor
                  }
              }
              text="Send Sleepy Eye"
            />
            <OpacityButton
              onPress={() => props.sendSyncCommand()}
              disabled={props.headlightsBusy}
              buttonStyle={
                props.headlightsBusy ?
                  {
                    ...styles.buttonDisabled,
                    backgroundColor: props.colorTheme.disabledButtonColor
                  } :
                  {
                    ...styles.commandButton,
                    backgroundColor: props.colorTheme.buttonColor
                  }
              }
              textStyle={
                props.headlightsBusy ?
                  {
                    ...styles.buttonText,
                    color: props.colorTheme.disabledButtonTextColor
                  } :
                  {
                    ...styles.buttonText,
                    color: props.colorTheme.buttonTextColor
                  }
              }
              text="Reset"
            />
          </View>
        </View>

        <OpacityButton
          onPress={() => props.close()}
          buttonStyle={{ marginTop: 10, marginBottom: 20, ...styles.button, backgroundColor: props.colorTheme.buttonColor }}
          textStyle={{ ...styles.buttonText, color: props.colorTheme.buttonTextColor }}
          text="Close"
        />
      </ScrollView>
    </Modal >
  )
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  commandButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    padding: 10,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 50,
    borderRadius: 5,
  },
  buttonDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    padding: 10,
  },
  buttonText: {
    fontSize: 20,
  },
  sleepInput: {
    padding: 10,
    textAlign: "center",
    width: 200,
    borderRadius: 5,
  }
});

export { DefaultCommands };