import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import base64 from "react-native-base64";
import { Base64 } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';
import { useEffect, useState } from 'react';

import { DefaultCommands } from "./Pages/DefaultCommands";
const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const REQUEST_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51520";
const SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51525";
const SYNC_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51526";

export default function App() {

  const { requestPermissions, scan, connectedDevice, disconnect, headlightsBusy, leftState, rightState } = useBLE();

  const [defaultCommandsOpen, setDefaultCommandsOpen] = useState(false);

  const scanForDevice = async () => {
    const permsEnabled = await requestPermissions();
    if (permsEnabled) {
      scan();
    }
  }

  const sendDefaultCommand = (value: number) => {
    console.log(value);
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithResponseForService(SERVICE_UUID, REQUEST_CHAR_UUID, base64.encode(value.toString())).catch(err => console.log(err));
  }

  const sendSleepCommand = (value: number) => {
    console.log(value);
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithResponseForService(SERVICE_UUID, SLEEPY_EYE_UUID, base64.encode(value.toString())).catch(err => console.log(err));
  }

  const sendSyncSignal = () => {
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithResponseForService(SERVICE_UUID, SYNC_UUID, base64.encode("1"));
  }

  useEffect(() => {
    scanForDevice();
  }, []);

  return (
    <View style={styles.container}>

      {
        !connectedDevice ? (<Text style={styles.text}>No Device Connected</Text>)
          : (
            <>
              <Text style={styles.text}> Connected to Wink Reciever</Text>
              <TouchableOpacity style={styles.button} key={1}>
                <Text style={styles.buttonText} onPress={() => setDefaultCommandsOpen(true)}>Go To Commands</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} key={2}>
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
  }
});
