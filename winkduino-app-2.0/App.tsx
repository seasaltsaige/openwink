import { ScrollView, StyleSheet, Text, View } from 'react-native';
import base64 from "react-native-base64";
import { useBLE } from './hooks/useBLE';
import { useEffect, useState } from 'react';
import { DefaultCommands } from "./Pages/DefaultCommands";
import { CreateCustomCommands } from './Pages/CreateCustomCommands';
import { CustomCommands } from './Pages/CustomCommands';
import { DeviceMACStore } from './AsyncStorage/DeviceMACStore';
import { Settings } from './Pages/Settings';
import { OpacityButton } from './Components/OpacityButton';
import { AutoConnectStore } from './AsyncStorage';
import { AppTheme } from './Pages/AppTheme';
import { useColorTheme } from './hooks/useColorTheme';
const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const REQUEST_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51520";
const LEFT_SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51525";
const RIGHT_SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51527"
const SYNC_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51526";
const LONG_TERM_SLEEP_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51528"


const UPDATE_URL = "http://...:3000"

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
    noDevice,
  } = useBLE();

  const [defaultCommandsOpen, setDefaultCommandsOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [customPresetOpen, setCustomPresetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appThemeOpen, setAppThemeOpen] = useState(false);

  const [autoConnect, setAutoConnect] = useState(true);

  const [_, setMAC] = useState<string | undefined>();

  const { colorTheme, update } = useColorTheme();

  const scanForDevice = async () => {
    const permsEnabled = await requestPermissions();
    if (permsEnabled) {
      await scan();
    }
  }

  const sendDefaultCommand = (value: number) => {
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, REQUEST_CHAR_UUID, base64.encode(value.toString())).catch(err => console.log(err));
  }

  const sendSleepCommand = (left: number, right: number) => {
    if (headlightsBusy) return;
    if (connectedDevice) {
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, LEFT_SLEEPY_EYE_UUID, base64.encode(left.toString())).catch(err => console.log(err));
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, RIGHT_SLEEPY_EYE_UUID, base64.encode(right.toString())).catch(err => console.log(err));
    }
  }

  const sendSyncSignal = () => {
    if (headlightsBusy) return;
    if (connectedDevice)
      connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, SYNC_UUID, base64.encode("1"));
  }

  const enterDeepSleep = async () => {
    if (!connectedDevice) return;
    try {
      await connectedDevice.writeCharacteristicWithoutResponseForService(SERVICE_UUID, LONG_TERM_SLEEP_UUID, base64.encode("1"));
      await disconnect();
    } catch (err) {
      console.log("ERROR SLEEPING");
      console.log(err);
    }
  }


  useEffect(() => {
    (async () => {
      const connect = await AutoConnectStore.get();
      if (connect === undefined) setAutoConnect(true);
      else setAutoConnect(false);

      const mac = await DeviceMACStore.getStoredMAC();
      setMAC(mac);

      if (connect === undefined && !isScanning && !isConnecting && !connectedDevice)
        await scanForDevice();
    })();
  }, [settingsOpen]);

  useEffect(() => {
    (async () => {
      update();
    })();
  }, [appThemeOpen]);

  useEffect(() => {

    // Check for app + or module updates

    // NOTE: will need to be connected to esp
    // NOTE: useBLE.ts will have esp software version on app connection
    // TODO: will need a rtc value on esp that keeps track of software version
    // TODO: will also need a characteristic for notifying phone of version
    // TODO: Phone on start will check esp version, fetch info from api using esp MAC as key to see if update is needed
    // TODO: if update is needed download file over phone internet, and store on phone temporarily.
    // TODO: popup to ask if user wants to update software
    // TODO: if no, delete update from phone, continue to app
    // TODO: if yes, alert module it will be updated, so
    // TODO: this should turn the esps wifi chip on, allowing the phone to connect, prompting them to do so
    // TODO: tell user update can take time, dont turn off, etc
    // TODO: send ota update over wifi using espressif example code.
    // TODO: update module with ota, once completed, updating firmware rtc value
    // TODO: delete file from phone

    // useState for file storage? since its temp?

  }, []);

  return (
    <ScrollView style={{ backgroundColor: colorTheme.backgroundPrimaryColor, height: "100%", width: "100%" }} contentContainerStyle={{ display: "flex", alignItems: "center", justifyContent: "flex-start", rowGap: 20 }}>
      <Text style={{ color: colorTheme.headerTextColor, textAlign: "center", fontSize: 20, marginHorizontal: 20, marginTop: 45 }}>
        {
          !connectedDevice ?
            !noDevice ?
              (isScanning ?
                "Scanning for Wink Module"
                : isConnecting ?
                  "Connecting to Wink Module... Stand by..."
                  : (autoConnect && connectedDevice) ?
                    "" : (!autoConnect && connectedDevice) ? "" :
                      "Scanner standing by... Press \"Connect\" to start scanning.")
              : autoConnect ? "No Wink Module Scanned... Trying again..."
                : "No Wink Module Scanned... Try scanning again, or restarting the app."
            : ""
        }
      </Text>

      <View style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: 10 }}>
        {
          !connectedDevice ?

            <Text style={{ color: colorTheme.textColor, textAlign: "center", marginHorizontal: 20 }}>
              If this takes overly long to connect, try restarting the app.{"\n"}
              If you continue to be unable to connect, try pressing the 'Reset Button' on your Wink Module, and restart the app.
            </Text>

            : <Text style={{ fontSize: 30, fontWeight: "bold", color: colorTheme.headerTextColor, marginTop: -20 }}>Connected to Wink Receiver</Text>
        }

        <View style={{ display: "flex", flexDirection: "row", width: "90%", justifyContent: "flex-start", alignContent: "center", columnGap: 20 }}>
          <OpacityButton
            buttonStyle={{}}
            text="Device Settings"
            textStyle={{ ...styles.buttonText, color: colorTheme.buttonColor, textDecorationLine: "underline", fontWeight: "bold" }}
            onPress={() => setSettingsOpen(true)}
          />

          <OpacityButton
            buttonStyle={{}}
            text="Edit Theme"
            textStyle={{ ...styles.buttonText, color: colorTheme.buttonColor, textDecorationLine: "underline", fontWeight: "bold" }}
            onPress={() => setAppThemeOpen(true)}
          />
        </View>
      </View>

      <View style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        rowGap: 20,
        width: "90%",
        borderRadius: 5,
        backgroundColor: colorTheme.backgroundSecondaryColor,
        padding: 30,
      }}>
        <Text style={{ color: colorTheme.headerTextColor, textAlign: "center", fontSize: 24, fontWeight: "bold" }}>Default Commands</Text>
        <Text style={{ color: colorTheme.textColor, textAlign: "center", fontSize: 16 }}>A list of pre-loaded commands that cover a variety of movements.</Text>

        <OpacityButton
          buttonStyle={!connectedDevice ? { ...styles.buttonDisabled, backgroundColor: colorTheme.disabledButtonColor } : { ...styles.button, backgroundColor: colorTheme.buttonColor }}
          disabled={!connectedDevice}
          text="Go to Commands"
          textStyle={!connectedDevice ? { ...styles.buttonText, color: colorTheme.disabledButtonTextColor } : { ...styles.buttonText, color: colorTheme.buttonTextColor }}
          onPress={() => setDefaultCommandsOpen(true)}
        />
      </View>

      <View style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        rowGap: 20,
        width: "90%",
        borderRadius: 5,
        borderColor: colorTheme.backgroundSecondaryColor,
        borderWidth: 3,
        padding: 30,
      }}>
        <Text style={{ color: colorTheme.headerTextColor, textAlign: "center", fontSize: 24, fontWeight: "bold" }}>Custom Presets</Text>
        <Text style={{ color: colorTheme.textColor, textAlign: "center", fontSize: 16 }}>If the default commands on this app aren't doing it for you, try making your own sequence of headlight movements!</Text>
        <OpacityButton
          buttonStyle={!connectedDevice ? { ...styles.buttonDisabled, backgroundColor: colorTheme.disabledButtonColor } : { ...styles.button, backgroundColor: colorTheme.buttonColor }}
          disabled={!connectedDevice}
          text="Create a Preset Command"
          textStyle={!connectedDevice ? { ...styles.buttonText, color: colorTheme.disabledButtonTextColor } : { ...styles.buttonText, color: colorTheme.buttonTextColor }}
          onPress={() => setCreateCustomOpen(true)}
        />
        <OpacityButton
          buttonStyle={!connectedDevice ? { ...styles.buttonDisabled, backgroundColor: colorTheme.disabledButtonColor } : { ...styles.button, backgroundColor: colorTheme.buttonColor }}
          disabled={!connectedDevice}
          text="Execute a Preset"
          textStyle={!connectedDevice ? { ...styles.buttonText, color: colorTheme.disabledButtonTextColor } : { ...styles.buttonText, color: colorTheme.buttonTextColor }}
          onPress={() => setCustomPresetOpen(true)}
        />
      </View>

      {
        (connectedDevice !== null) ?
          <OpacityButton
            disabled={!connectedDevice}
            buttonStyle={{
              ...(!connectedDevice ? { ...styles.buttonDisabled, backgroundColor: colorTheme.disabledButtonColor } : { ...styles.button, backgroundColor: colorTheme.buttonColor }), marginBottom: 20
            }}
            textStyle={!connectedDevice ? { ...styles.buttonText, color: colorTheme.disabledButtonTextColor } : { ...styles.buttonText, color: colorTheme.buttonTextColor }}
            onPress={() => disconnect()}
            text="Disconnect"
          />
          // connectedDevice is null
          :
          !autoConnect ?
            <OpacityButton
              disabled={noDevice ? false : (isConnecting || isScanning)}
              buttonStyle={{ ...((noDevice ? false : (isConnecting || isScanning)) ? { ...styles.buttonDisabled, backgroundColor: colorTheme.disabledButtonColor } : { ...styles.button, backgroundColor: colorTheme.buttonColor }), marginBottom: 20 }}
              textStyle={((noDevice ? false : (isConnecting || isScanning))) ? { ...styles.buttonText, color: colorTheme.disabledButtonTextColor } : { ...styles.buttonText, color: colorTheme.buttonTextColor }}
              onPress={() => scanForDevice()}
              text="Connect"
            />
            : <></>
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
        colorTheme={colorTheme}
        key={1}
      />

      <CreateCustomCommands
        close={() => setCreateCustomOpen(false)}
        device={connectedDevice}
        visible={createCustomOpen}
        colorTheme={colorTheme}
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
        colorTheme={colorTheme}
        key={3}
      />

      <Settings
        close={() => setSettingsOpen(false)}
        visible={settingsOpen}
        enterDeepSleep={enterDeepSleep}
        colorTheme={colorTheme}
        key={4}
      />

      <AppTheme
        close={() => setAppThemeOpen(false)}
        visible={appThemeOpen}
        key={5}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
