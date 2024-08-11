import { StyleSheet, Text, View } from 'react-native';
import base64 from "react-native-base64";
import { useBLE } from './hooks/useBLE';
import { useEffect, useState } from 'react';

import { DefaultCommands } from "./Pages/DefaultCommands";
import { CreateCustomCommands } from './Pages/CreateCustomCommands';
import { CustomCommands } from './Pages/CustomCommands';
import { DeviceMACStore } from './AsyncStorage/DeviceMACStore';
import { Settings } from './Pages/Settings';
import { OpacityButton } from './Components/OpacityButton';
const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const REQUEST_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51520";
const SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51525";
const SYNC_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51526";

export default function App() {

  const {
    requestPermissions,
    scan,
    disconnect,
    connectedDevice,
    headlightsBusy,
    leftState,
    rightState,
    isConnecting,
    isScanning,
  } = useBLE();

  const [defaultCommandsOpen, setDefaultCommandsOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [customPresetOpen, setCustomPresetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [MAC, setMAC] = useState<string | undefined>();

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

  const [timeLeftScan, setTimeLeftScan] = useState(12);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setTimeLeftScan((prev) => prev - 1);
        if (timeLeftScan === 0) {
          clearInterval(interval);
          setTimeLeftScan(12);
        }
      }, 1000);
    }
  }, [isScanning]);

  useEffect(() => {
    if (connectedDevice !== null) return;
    scanForDevice();
    (async () => {
      const mac = await DeviceMACStore.getStoredMAC();
      setMAC(mac);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ color: "white", textAlign: "center", fontSize: 20 }}>
        {
          isScanning ?
            `Scanning for ${MAC ? "wink module..." : `${timeLeftScan} second(s)...`}`
            : isConnecting ?
              "Connecting to wink receiver... Stand by..."
              : <></>
        }
      </Text>

      <View style={{ marginBottom: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: 10 }}>
        {
          !connectedDevice ?
            <>
              {
                !MAC ?
                  <Text style={{ color: "white", textAlign: "center" }}>This appears to be your first time scanning. Your first connection to your wink module will take longer than subsequent connections. Moving closer can help.</Text>
                  :
                  <Text style={{ color: "white", textAlign: "center" }}>If this takes overly long to connect, try restarting the app.</Text>
              }
            </>
            : <Text style={styles.text}>Connected to Wink Receiver</Text>
        }
        <OpacityButton
          buttonStyle={{}}
          text="Device Settings"
          textStyle={{ ...styles.buttonText, color: "#0060df", textDecorationLine: "underline" }}
          onPress={() => setSettingsOpen(true)}
        />
      </View>

      <>

        <OpacityButton
          buttonStyle={!connectedDevice ? styles.buttonDisabled : styles.button}
          disabled={!connectedDevice}
          text="Go to Commands"
          textStyle={styles.buttonText}
          onPress={() => setDefaultCommandsOpen(true)}
        />

        <View style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: 20, marginTop: 50, }}>
          <OpacityButton
            buttonStyle={!connectedDevice ? styles.buttonDisabled : styles.button}
            disabled={!connectedDevice}
            text="Create a Preset Command"
            textStyle={styles.buttonText}
            onPress={() => setCreateCustomOpen(true)}
          />
          <OpacityButton
            buttonStyle={!connectedDevice ? styles.buttonDisabled : styles.button}
            disabled={!connectedDevice}
            text="Execute a Preset"
            textStyle={styles.buttonText}
            onPress={() => setCustomPresetOpen(true)}
          />
        </View>

        <OpacityButton
          disabled={!connectedDevice}
          buttonStyle={{ ...(!connectedDevice ? styles.buttonDisabled : styles.button), marginTop: 75 }}
          textStyle={styles.buttonText}
          onPress={() => disconnect()}
          text="Disconnect"
        />
      </>




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

      <Settings
        close={() => setSettingsOpen(false)}
        visible={settingsOpen}
      />

    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgb(20, 20, 20)",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    rowGap: 20,
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
    textAlign: "center"
  }
});
