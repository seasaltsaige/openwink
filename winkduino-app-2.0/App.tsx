import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import base64 from "react-native-base64";
import { Base64 } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';
import { useEffect, useState } from 'react';

import { DefaultCommands } from "./Pages/DefaultCommands";
import { CreateCustomCommands } from './Pages/CreateCustomCommands';
import { CustomCommands } from './Pages/CustomCommands';
const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const REQUEST_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51520";
const SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51525";
const SYNC_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51526";

export default function App() {

  const { requestPermissions, scan, connectedDevice, disconnect, headlightsBusy, leftState, rightState } = useBLE();

  const [defaultCommandsOpen, setDefaultCommandsOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [customPresetOpen, setCustomPresetOpen] = useState(false);

  const scanForDevice = async () => {
    const permsEnabled = await requestPermissions();
    if (permsEnabled) {
      await scan();
    }
  }

  const sendDefaultCommand = (value: number) => {
    console.log(value);
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, REQUEST_CHAR_UUID, base64.encode(value.toString())).catch(err => console.log(err));
  }

  const sendSleepCommand = (value: number) => {
    console.log(value);
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, SLEEPY_EYE_UUID, base64.encode(value.toString())).catch(err => console.log(err));
  }

  const sendSyncSignal = () => {
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, SYNC_UUID, base64.encode("1"));
  }

  useEffect(() => {
    scanForDevice();
  }, []);

  return (
    <View style={styles.container}>

      {
        !connectedDevice ? (
          <>
            <Text style={styles.text}>Scanning for Wink Reciever...</Text>
            <Text style={{ color: "white", textAlign: "center" }}>If this takes overly long to connect, try restarting the app.</Text>
          </>
        )
          : (
            <>
              <Text style={styles.text}>Connected to Wink Reciever</Text>
              <TouchableOpacity style={styles.button} key={1}>
                <Text style={styles.buttonText} onPress={() => setDefaultCommandsOpen(true)}>Go To Commands</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} key={2}>
                <Text style={styles.buttonText} onPress={() => setCreateCustomOpen(true)}>Create a Preset Command</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} key={3}>
                <Text style={styles.buttonText} onPress={() => setCustomPresetOpen(true)}>Execute a Preset</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} key={4}>
                <Text style={styles.buttonText} onPress={() => disconnect()}>Disconnect</Text>
              </TouchableOpacity>
            </>
          )

      }

      <DefaultCommands
        close={() => setDefaultCommandsOpen(false)}
        device={connectedDevice}
        headlightsBusy={headlightsBusy}
        leftState={leftState}
        rightState={rightState}
        visible={defaultCommandsOpen}
        sendDefaultCommand={sendDefaultCommand}
        sendSleepCommand={sendSleepCommand}
        sendSyncCommand={sendSyncSignal}
        key={1}
      />

      <CreateCustomCommands
        close={() => setCreateCustomOpen(false)}
        device={connectedDevice}
        visible={createCustomOpen}
        key={2}
      />

      <CustomCommands
        close={() => setCustomPresetOpen(false)}
        device={connectedDevice}
        headlightBusy={headlightsBusy}
        leftStatus={leftState}
        rightStatus={rightState}
        visible={customPresetOpen}
        sendDefaultCommand={sendDefaultCommand}
      />

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(20, 20, 20)',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 25,
  },
  text: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold"
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
  buttonText: {
    color: "white",
    fontSize: 20,
    textAlign: "center"
  }
});
