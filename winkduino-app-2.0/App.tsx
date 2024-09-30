import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { buttonBehaviorMap, ButtonBehaviors, CustomOEMButtonStore } from './AsyncStorage/CustomOEMButtonStore';

import WifiManager from 'react-native-wifi-reborn';
import { BridgeServer, respond, start, stop } from "react-native-http-bridge-refurbished";
import { NetworkInfo } from "react-native-network-info";
import React from 'react';


const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
const REQUEST_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51520";
const LEFT_SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51525";
const RIGHT_SLEEPY_EYE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51527"
const SYNC_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51526";
const LONG_TERM_SLEEP_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51528"
const CUSTOM_BUTTON_UPDATE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51530";

// const UPDATE_URL = "https://update-server.netlify.app/.netlify/functions/api/update";
const UPDATE_URL = "http://192.168.1.107:3000/.netlify/functions/api/update";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const generatePassword = (len: number) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  for (let i = 0; i < len; ++i) {
    const n = charset.length;
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}


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
    firmwareVersion,
    MAC
  } = useBLE();

  const [defaultCommandsOpen, setDefaultCommandsOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [customPresetOpen, setCustomPresetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appThemeOpen, setAppThemeOpen] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [promptResponse, setPromptResponse] = useState(null as boolean | null);
  const [firmwareDescription, setFirmwareDescription] = useState("");
  const [fileSize, setFileSize] = useState(0);

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

  const updateOEMButtonPresets = async (presses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, to: ButtonBehaviors) => {
    //@ts-ignore
    if (to === 0)
      await CustomOEMButtonStore.remove(presses);
    else
      await CustomOEMButtonStore.set(presses, to);

    await connectedDevice?.writeCharacteristicWithoutResponseForService(SERVICE_UUID, CUSTOM_BUTTON_UPDATE_UUID, base64.encode((presses).toString()));
    await sleep(20);
    //@ts-ignore
    await connectedDevice?.writeCharacteristicWithoutResponseForService(SERVICE_UUID, CUSTOM_BUTTON_UPDATE_UUID, base64.encode(to === 0 ? "0" : buttonBehaviorMap[to].toString()));
    await sleep(20);
  }

  // SHOULD DISALLOW VALUES LESS THAN ~100 ms since that doesn't make a bunch of sense
  const updateButtonDelay = async (delay: number) => {
    await CustomOEMButtonStore.setDelay(delay);
    await connectedDevice?.writeCharacteristicWithoutResponseForService(SERVICE_UUID, CUSTOM_BUTTON_UPDATE_UUID, base64.encode(delay.toString()));
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

    (async () => {
      try {
        const FIRMWARE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51531";
        const firmware = await connectedDevice?.readCharacteristicForService(SERVICE_UUID, FIRMWARE_UUID);
        if (firmware?.value) {
          const fw = base64.decode(firmware.value);
          console.log(fw);
          const response = await fetch(UPDATE_URL, { method: "GET", headers: { authorization: MAC! }, });
          console.log(response.status);
          if (response.status !== 200) return;
          const json = await response.json();
          const apiVersion = json["version"] as string;
          console.log(apiVersion);

          const apiVParts = apiVersion.split(".");
          const fwParts = fw.split(".");

          let upgradeAvailable = false;
          for (let i = 0; i < 3; i++) {
            const apiPart = parseInt(apiVParts[i]);
            const fwPart = parseInt(fwParts[i]);
            if (apiPart > fwPart)
              upgradeAvailable = true;
          }

          if (upgradeAvailable) {
            // Create upgrade available popup.
            // Simple popup that asks user to download file.
            // If no, continue to app
            // If yes, download software upgrade and continue with below
            setUpgradeModalOpen(true);

          }
        }
      } catch (err) {
        // setUpgradeModalOpen(false);
        // setPromptResponse(null);
      }
    })();

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

  }, [connectedDevice !== null]);

  const downloadAndInstallFirmware = async () => {
    const response = await fetch(`${UPDATE_URL}/firmware`, { method: "GET", headers: { authorization: MAC! } });
    const blob = await response.blob();

    const password = generatePassword(16);

    await connectedDevice?.writeCharacteristicWithoutResponseForService(
      SERVICE_UUID,
      CUSTOM_BUTTON_UPDATE_UUID,
      base64.encode(password)
    );
    await sleep(2000);
    // await WifiManager.connectToProtectedSSIDOnce("Wink Module: Update Access Point", password, true, true);
    WifiManager.connectToProtectedWifiSSID({
      ssid: "Wink Module: Update Access Point",
      password: password,
      isWEP: false,
      isHidden: false,
      timeout: 10,
    }).then(async () => {
      // Success
      const res = await fetch("http://update.local", { method: "GET" });

      if (res.ok) {
        console.log("SUCCESSFULLY QUERIED ESP32-S3 HTTP SERVER");
      }
    });



    // console.log(blob.size);
  }

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
        device={connectedDevice}
        updateOEMButton={updateOEMButtonPresets}
        updateButtonDelay={updateButtonDelay}
        key={4}
      />

      <AppTheme
        close={() => setAppThemeOpen(false)}
        visible={appThemeOpen}
        key={5}
      />

      {/* FIRMWARE UPGRADE SCREEN / POPUP */}
      <Modal
        visible={connectedDevice !== null && upgradeModalOpen}
        animationType="slide"
        hardwareAccelerated
        transparent
      >
        {
          promptResponse === null ?
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "85%",
                padding: 15,
                position: "absolute",
                bottom: 60,
                elevation: 5,
                shadowColor: "black",
                rowGap: 15,
                shadowOpacity: 1,
                shadowRadius: 10,
                borderRadius: 10,
                alignSelf: "center",
                backgroundColor: colorTheme.backgroundSecondaryColor,
              }}
            >
              <Text
                style={{
                  color: colorTheme.textColor,
                  textAlign: "center",
                  fontSize: 17,
                  width: "100%",
                }}
              >
                An Wink Module Firmware update is available.{"\n"}
                Would you like to install it now?
                {firmwareDescription}
              </Text>
              <View style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                columnGap: 25,
              }}>
                <OpacityButton
                  text="Install"
                  buttonStyle={{
                    backgroundColor: "#228B22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 15,
                    paddingVertical: 7,
                    borderRadius: 5,
                  }}
                  textStyle={{
                    color: colorTheme.buttonTextColor,
                    fontSize: 17,
                    fontWeight: "bold",
                  }}
                  onPress={async () => {
                    setUpgradeModalOpen(false);
                    setPromptResponse(true);
                    await sleep(100);
                    setUpgradeModalOpen(true);
                    await downloadAndInstallFirmware();
                  }}
                />

                <OpacityButton
                  text="Not now"
                  buttonStyle={{
                    backgroundColor: "#de142c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 15,
                    paddingVertical: 7,
                    borderRadius: 5,
                  }}
                  textStyle={{
                    color: colorTheme.buttonTextColor,
                    fontSize: 17,
                    fontWeight: "bold",
                  }}
                  onPress={async () => {
                    setUpgradeModalOpen(false);
                    setPromptResponse(false);
                    await sleep(500);
                    setUpgradeModalOpen(true);
                    setTimeout(() => {
                      setUpgradeModalOpen(false);
                      setPromptResponse(null);
                    }, 5000);
                  }}
                />
              </View>
            </View>
            // <View
            //   style={{
            //     width: "100%",
            //     height: "100%",
            //     display: "flex",
            //     flexDirection: "column",
            //     alignItems: "center",
            //     justifyContent: "center",
            //     backgroundColor: "rgba(0, 0, 0, 0.3)",
            //     zIndex: 1000,
            //   }}
            // >
            //   <View
            //     style={{
            //       backgroundColor: colorTheme.backgroundPrimaryColor,
            //       display: "flex",
            //       flexDirection: "column",
            //       alignItems: "center",
            //       justifyContent: "flex-start",
            //       padding: 20,
            //       rowGap: 20,
            //       width: "80%",
            //       borderRadius: 5,
            //     }}
            //   >
            //   </View>
            // </View>
            : promptResponse === false ?
              // Download denied
              <></>
              :
              // Download accepted
              <>
              </>
        }
      </Modal>

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
