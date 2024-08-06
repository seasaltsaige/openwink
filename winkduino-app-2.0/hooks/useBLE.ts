import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, ScanCallbackType, ScanMode } from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";

const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520"

const BUSY_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51521"
const LEFT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51523";
const RIGHT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51524";


function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  // const [allDevices, setAllDevice]
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftState, setLeftState] = useState(0)
  const [rightState, setRightState] = useState(0)

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

      connection.monitorCharacteristicForService(SERVICE_UUID, BUSY_CHAR_UUID, (err, char) => {
        const strVal = base64.decode(char?.value!);
        if (parseInt(strVal) === 1) setHeadlightsBusy(true);
        else setHeadlightsBusy(false);
        // if (char)
        //   console.log(char.value);
      });

      connection.monitorCharacteristicForService(SERVICE_UUID, LEFT_STATUS_UUID, (err, char) => {
        const strVal = base64.decode(char?.value!);
        const intVal = parseInt(strVal);
        if (intVal > 1) {
          const realValDecimal = (intVal - 10) / 100;
          setLeftState(realValDecimal);
        } else {
          setLeftState(intVal);
        }
      });
      connection.monitorCharacteristicForService(SERVICE_UUID, RIGHT_STATUS_UUID, (err, char) => {
        const strVal = base64.decode(char?.value!);
        const intVal = parseInt(strVal);
        if (intVal > 1) {
          const realValDecimal = (intVal - 10) / 100;
          setRightState(realValDecimal);
        } else {
          setRightState(intVal);
        }
      });




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


  const scan = () => {
    bleManager.startDeviceScan(null, { allowDuplicates: true, callbackType: ScanCallbackType.AllMatches, legacyScan: false, scanMode: ScanMode.LowLatency }, (err, device) => {
      if (err) {
        console.log(err);
      }
      if (device) {
        // DEVICE MAC ID
        if (device.id === "3C:84:27:DC:4B:89") {
          connectToDevice(device);
          console.log(device.id);
        }
      }
    });
  }

  const disconnect = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);

      scan();
    }
  }

  // Callbacks



  return {
    requestPermissions,
    scan,
    disconnect,
    connectedDevice,
    headlightsBusy,
    leftState,
    rightState,
    bleManager
  }
}

export { useBLE };