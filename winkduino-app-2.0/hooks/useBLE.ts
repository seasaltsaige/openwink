import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, ScanCallbackType, ScanMode, Subscription } from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";

const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520"

const BUSY_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51521"
const LEFT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51523";
const RIGHT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51524";


const sleep = (ms: number) => {
  return new Promise((res, rej) => setTimeout(res, ms));
}

function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  // const [allDevices, setAllDevice]
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftState, setLeftState] = useState(0);
  const [rightState, setRightState] = useState(0);

  const [reqSub, setReqSub] = useState<Subscription>();
  const [leftSub, setLeftSub] = useState<Subscription>();
  const [rightSub, setRightSub] = useState<Subscription>();

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
            message: "Bluetooth Low Energy requires Location",
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
      setConnectedDevice(connection);
      await connection.discoverAllServicesAndCharacteristics();
      await bleManager.stopDeviceScan();

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

      console.log(leftInitStatus?.value);
      console.log(rightInitStatus?.value);

      if (leftInitStatus) {
        if (base64.decode(leftInitStatus.value!) === "1") setLeftState(1);
        else setLeftState(0);
      }
      if (rightInitStatus) {
        if (base64.decode(rightInitStatus.value!) === "1") setRightState(1);
        else setRightState(0);
      }

      connection.onDisconnected((err, device) => {
        if (err) {
          console.log(err);
        }
        console.log("Disconnected from device");
        setConnectedDevice(null);
        scan();
      });
      // await device.discoverAllServicesAndCharacteristics()
      console.log(connection.name, connectedDevice?.localName);
      console.log("Connected to device", connectedDevice?.localName);
      // connection.monitorCharacteristicForService()
    } catch (err) {
      console.log("Failed to connect: ");
      console.log(err);
    }
  }


  const scan = async () => {
    console.log("BEGIN SCAN");
    bleManager.startDeviceScan(null, { allowDuplicates: false, callbackType: ScanCallbackType.AllMatches, legacyScan: false, scanMode: ScanMode.LowLatency }, async (err, device) => {
      if (err) {
        console.log(JSON.stringify(err));
        if (err.message.includes("scanning")) {
          await sleep(1000);
        }
      }
      if (device) {
        // DEVICE MAC ID
        if (device.id === "3C:84:27:DC:4B:89") {
          await connectToDevice(device);
          console.log(device.id);
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

      try {
        await connectedDevice?.cancelConnection();
        setConnectedDevice(null);
        await scan();
      } catch (err) {
        console.log("ERROR DISCONNECTING", err);
      }
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
    bleManager
  }
}

export { useBLE };