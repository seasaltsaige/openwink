import { useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, ScanCallbackType, ScanMode, Subscription } from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import { DeviceMACStore } from "../AsyncStorage/DeviceMACStore";
import { AutoConnectStore } from "../AsyncStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buttonBehaviorMap, CustomOEMButtonStore } from "../AsyncStorage/CustomOEMButtonStore";

const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";

const BUSY_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51521";
const LEFT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51523";
const RIGHT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51524";

const CUSTOM_BUTTON_UPDATE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51530";
const FIRMWARE_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51531";

const SCAN_TIME_SECONDS = 30;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));


function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  //@ts-ignore
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftState, setLeftState] = useState(0);
  const [rightState, setRightState] = useState(0);

  const [MAC, setMAC] = useState<string | undefined>(undefined);

  const [firmwareVersion, setFirmwareVersion] = useState(null as string | null);
  const [noDevice, setNoDevice] = useState(false);

  const [reqSub, setReqSub] = useState<Subscription>();
  const [leftSub, setLeftSub] = useState<Subscription>();
  const [rightSub, setRightSub] = useState<Subscription>();

  // Home page states
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);


  useEffect(() => {
    (async () => {
      const mac = await DeviceMACStore.getStoredMAC();
      setMAC(mac);
    })();
  }, []);

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {

    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app requires Location Services to function correctly.",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };


  const connectToDevice = async (device: Device) => {
    try {
      const connection = await bleManager.connectToDevice(device.id);
      await connection.discoverAllServicesAndCharacteristics();

      await DeviceMACStore.setMAC(connection.id);
      setMAC(connection.id);

      setConnectedDevice(connection);
      setIsConnecting(false);

      const subReq = connection.monitorCharacteristicForService(SERVICE_UUID, BUSY_CHAR_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        if (parseInt(strVal) === 1) setHeadlightsBusy(true);
        else setHeadlightsBusy(false);
      });

      const subLeft = connection.monitorCharacteristicForService(SERVICE_UUID, LEFT_STATUS_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        const intVal = parseInt(strVal);
        if (intVal > 1) {
          const realValDecimal = (intVal - 10) / 100;
          setLeftState(realValDecimal);
        } else setLeftState(intVal);
      });

      const subRight = connection.monitorCharacteristicForService(SERVICE_UUID, RIGHT_STATUS_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        const intVal = parseInt(strVal);
        if (intVal > 1) {
          const realValDecimal = (intVal - 10) / 100;
          setRightState(realValDecimal);
        } else setRightState(intVal);
      });


      setReqSub(subReq);
      setLeftSub(subLeft);
      setRightSub(subRight);


      const leftInitStatus = await connection?.readCharacteristicForService(SERVICE_UUID, LEFT_STATUS_UUID);
      const rightInitStatus = await connection?.readCharacteristicForService(SERVICE_UUID, RIGHT_STATUS_UUID);


      if (leftInitStatus) {
        if (base64.decode(leftInitStatus.value!) === "1") setLeftState(1);
        else setLeftState(0);
      }
      if (rightInitStatus) {
        if (base64.decode(rightInitStatus.value!) === "1") setRightState(1);
        else setRightState(0);
      }

      const firmware = await connection?.readCharacteristicForService(SERVICE_UUID, FIRMWARE_UUID);
      if (firmware.value) {
        setFirmwareVersion(base64.decode(firmware.value));
      }

      // Handle disconnect
      connection.onDisconnected(async (err, device) => {
        if (err)
          return console.log("Error disconnecting from device: ", err);
        console.log("Disconnected from device");
        setConnectedDevice(null);

        // CHECK IF AUTOCONNECT IS ENABLED
        const autoConnect = await AutoConnectStore.get();
        if (autoConnect === undefined)
          scan();

      });

      console.log("Connected to Wink Receiver");
      return true;
    } catch (err) {
      console.log("Failed to connect: ");
      console.log(err);

      setConnectedDevice(null);
      setIsConnecting(false);
      setIsScanning(true);
      setNoDevice(false);
      await scan();
      return false;
    }

  }

  const scan = async () => {
    if (connectedDevice !== null) return;
    console.log("BEGIN SCAN");
    setNoDevice(false);
    let foundDevice = false;

    // const allDevices: Device[] = [];
    const mac = await DeviceMACStore.getStoredMAC();
    setTimeout(async () => {

      const autoConnect = await AutoConnectStore.get();
      if (!foundDevice) {
        setNoDevice(true);
        setIsConnecting(false);
        setIsScanning(false);
        await bleManager.stopDeviceScan();
        console.log("No Device Found");
        if (autoConnect === undefined)
          scan();
        return;
      }
    }, SCAN_TIME_SECONDS * 1000);


    setIsScanning(true);


    bleManager.startDeviceScan(null, { allowDuplicates: false, callbackType: ScanCallbackType.FirstMatch, legacyScan: false, scanMode: ScanMode.LowLatency }, async (err, device) => {
      if (err) {
        console.log(err);
      }
      if (device) {
        if (device.id === mac) {
          console.log("Stored device scanned");
          foundDevice = true;
          await bleManager.stopDeviceScan();
          setIsScanning(false);
          setIsConnecting(true);
          await connectToDevice(device);
        } else if (device.serviceUUIDs && device.serviceUUIDs?.includes(SERVICE_UUID)) {
          console.log("Found matching UUIDs")
          foundDevice = true;
          await bleManager.stopDeviceScan();
          setIsScanning(false);
          setIsConnecting(true);
          await connectToDevice(device);
        }
      }
    });
  }




  const disconnect = async () => {
    console.log("BEGIN DISCONNECT");
    const isConnected = await connectedDevice?.isConnected();
    if (isConnected) {
      reqSub?.remove();
      leftSub?.remove();
      rightSub?.remove();
      await connectedDevice?.cancelConnection();
    }
  }


  return {
    requestPermissions,
    scan,
    disconnect,
    setHeadlightsBusy,
    connectedDevice,
    headlightsBusy,
    leftState,
    rightState,
    bleManager,
    MAC,
    // allDevices,
    isScanning,
    isConnecting,
    noDevice,
    firmwareVersion
  }
}

export { useBLE };