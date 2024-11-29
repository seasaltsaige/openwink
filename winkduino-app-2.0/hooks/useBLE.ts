import { useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, ScanCallbackType, ScanMode, Subscription } from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import { DeviceMACStore } from "../AsyncStorage/DeviceMACStore";
import { AutoConnectStore } from "../AsyncStorage";

import {
  BUSY_CHAR_UUID,
  FIRMWARE_UUID,
  LEFT_STATUS_UUID,
  RIGHT_STATUS_UUID,
  SCAN_TIME_SECONDS,
  SERVICE_UUID,
  SOFTWARE_STATUS_UUID,
  SOFTWARE_UPDATING_UUID
} from "../helper/Constants";


function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);

  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftState, setLeftState] = useState(0);
  const [rightState, setRightState] = useState(0);

  const [MAC, setMAC] = useState<string | undefined>(undefined);
  const [firmwareVersion, setFirmwareVersion] = useState(null as string | null);

  const [noDevice, setNoDevice] = useState(false);

  // Home page states
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);


  // Update tracking / status
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState("idle" as "idle" | "updating" | "failed" | "success");


  // Delay between when headlights start moving
  // Default is 750 ms
  const [waveDelay, setWaveDelay] = useState(750);


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

      connection.monitorCharacteristicForService(SERVICE_UUID, BUSY_CHAR_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        if (parseInt(strVal) === 1) setHeadlightsBusy(true);
        else setHeadlightsBusy(false);
      });

      connection.monitorCharacteristicForService(SERVICE_UUID, LEFT_STATUS_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        const intVal = parseInt(strVal);
        if (intVal > 1) {
          const realValDecimal = (intVal - 10) / 100;
          setLeftState(realValDecimal);
        } else setLeftState(intVal);
      });

      connection.monitorCharacteristicForService(SERVICE_UUID, RIGHT_STATUS_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        const intVal = parseInt(strVal);
        if (intVal > 1) {
          const realValDecimal = (intVal - 10) / 100;
          setRightState(realValDecimal);
        } else setRightState(intVal);
      });

      connection.monitorCharacteristicForService(SERVICE_UUID, SOFTWARE_UPDATING_UUID, (err, char) => {
        if (err) return console.log(err);
        const strVal = base64.decode(char?.value!);
        const val = parseInt(strVal);
        setUpdateProgress(val);
      })

      connection.monitorCharacteristicForService(SERVICE_UUID, SOFTWARE_STATUS_UUID, (err, char) => {
        if (err) return console.log(err);
        const val = base64.decode(char?.value!);
        console.log(char?.value, val);
        setUpdatingStatus(val as any);
      });


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
        await DeviceMACStore.setFirmwareVersion(base64.decode(firmware.value));
      }

      // Handle disconnect
      connection.onDisconnected(async (err, device) => {
        if (err)
          return console.log("Error disconnecting from device: ", err);

        console.log("Disconnected from device");
        setConnectedDevice(null);

        // CHECK IF AUTO CONNECT IS ENABLED
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
      const autoConnect = await AutoConnectStore.get();
      if (autoConnect === undefined)
        await scan();
      return false;
    }

  }

  const scan = async () => {
    if (connectedDevice !== null) return;
    console.log("Device Scan Started...");

    setNoDevice(false);

    let foundDevice = false;

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
    }, SCAN_TIME_SECONDS);


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
    console.log("Disconnecting From Device");
    const isConnected = await connectedDevice?.isConnected();
    if (isConnected)
      await connectedDevice?.cancelConnection();
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
    isScanning,
    isConnecting,
    noDevice,
    firmwareVersion,
    updateProgress,
    updatingStatus,
  }
}

export {
  useBLE
};