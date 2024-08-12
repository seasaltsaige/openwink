import { useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, ScanCallbackType, ScanMode, Subscription } from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import { DeviceMACStore } from "../AsyncStorage/DeviceMACStore";
import { AutoConnectStore } from "../AsyncStorage";

const SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";

const BUSY_CHAR_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51521";
const LEFT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51523";
const RIGHT_STATUS_UUID = "a144c6b1-5e1a-4460-bb92-3674b2f51524";


const sleep = (ms: number) => {
  return new Promise((res, rej) => setTimeout(res, ms));
}

function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftState, setLeftState] = useState(0);
  const [rightState, setRightState] = useState(0);

  const [MAC, setMAC] = useState<string | undefined>(undefined);
  const [checkedMACs, setCheckedMACs] = useState<string[]>([]);

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


  const connectToDevice = async (device: Device, discovery = false) => {
    try {
      const connection = await bleManager.connectToDevice(device.id);
      await connection.discoverAllServicesAndCharacteristics();
      // Logic to discover characteristics and see whats up
      if (discovery) {
        console.log("Discovering device: ", connection.id);
        const services = await connection.services();
        const serviceUUIDs = services.map(s => s.uuid);
        console.log(serviceUUIDs);
        let foundService = false;
        if (!serviceUUIDs.includes(SERVICE_UUID)) foundService = false;
        else foundService = true;

        if (!foundService) {
          setCheckedMACs((prev) => [...prev, connection.id]);
          console.log("Disconnecting from device: ", connection.id);
          await connection.cancelConnection();
          return false;
        } else {
          await DeviceMACStore.setMAC(connection.id);
          setMAC(connection.id);
        }
      }

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
      return false;
    }

  }


  const attemptConnections = async (allDevices: Device[]) => {
    console.log("Stopping scan...");

    await bleManager.stopDeviceScan();
    setIsScanning(false);

    console.log("Attempting connections...");
    setIsConnecting(true);

    const mac = await DeviceMACStore.getStoredMAC();
    console.log("Stored MAC:", mac);


    if (mac !== undefined) {
      console.log("Stored MAC Found, attempting to connect");
      const device = allDevices.find((dev) => dev.id === mac);
      if (device && device.id === mac) {
        await connectToDevice(device);
      }
    } else {
      console.log("No Stored MAC Found... checking devices");
      let foundConnection = false;
      for (const device of allDevices) {
        if (foundConnection) break;
        // Logic to discover if device is correct
        try {
          if (!checkedMACs.includes(device.id)) {
            console.log("Scan method, new device id: ", device.id);
            const val = await connectToDevice(device, true);
            if (val === true) foundConnection = true;;
          }
        } catch (err) {
          console.log("Error connecting: ", err);
          bleManager.cancelDeviceConnection(device.id).catch(err => console.log("Error cancelling connection:", err));
        }
      }
    }
  }

  const scan = async () => {
    if (connectedDevice !== null) return;
    console.log("BEGIN SCAN");

    let foundDevice = false;

    const allDevices: Device[] = [];
    const mac = await DeviceMACStore.getStoredMAC();
    setTimeout(async () => {
      if (foundDevice) return;
      await attemptConnections(allDevices);
    }, 12 * 1000);
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
        }

        console.log("New device discovered:", device.id);
        allDevices.push(device);
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
  }
}

export { useBLE };