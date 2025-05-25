import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BleManager, Device, ScanCallbackType, ScanMode } from 'react-native-ble-plx';
import { BUSY_CHAR_UUID, CUSTOM_BUTTON_UPDATE_UUID, FIRMWARE_UUID, HEADLIGHT_CHAR_UUID, LEFT_STATUS_UUID, MODULE_SETTINGS_SERVICE_UUID, OTA_SERVICE_UUID, RIGHT_STATUS_UUID, SCAN_TIME_SECONDS, SOFTWARE_STATUS_CHAR_UUID, SOFTWARE_UPDATING_CHAR_UUID, WINK_SERVICE_UUID } from '../helper/Constants';
import { AutoConnectStore, CustomOEMButtonStore, DeviceMACStore, FirmwareStore } from '../Storage';
import base64 from 'react-native-base64';
import { PermissionsAndroid, Platform } from 'react-native';
import * as ExpoDevice from "expo-device";
import { toProperCase } from '../helper/Functions';
import { ButtonBehaviors } from '../helper/Types';

export type BleContextType = {
  device: Device | null;
  requestPermissions: () => Promise<boolean>;
  scanForModule: () => Promise<void>;
  disconnectFromModule: () => Promise<void>;
  sendDefaultCommand: (command: number) => Promise<void>;
  setHeadlightsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setOEMButtonStatus: (status: "enable" | "disable") => Promise<boolean>;
  updatingStatus: 'Idle' | 'Updating' | 'Failed' | 'Success';
  updateProgress: number;
  oemCustomButtonEnabled: boolean;
  firmwareVersion: string;
  isConnecting: boolean;
  isScanning: boolean;
  manager: BleManager;
  mac: string;
  rightStatus: number;
  leftStatus: number;
  headlightsBusy: boolean;
};

export const BleContext = createContext<BleContextType | null>(null);

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const manager = useMemo(() => new BleManager(), []);

  // Connected device
  const [device, setDevice] = useState<Device | null>(null);

  // Monitored characteristic values
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftStatus, setLeftStatus] = useState(0);
  const [rightStatus, setRightStatus] = useState(0);

  const [mac, setMac] = useState("");
  const [oemCustomButtonEnabled, setOemCustomButtonEnabled] = useState(false);
  const [firmwareVersion, setFirmwareVersion] = useState("");

  const [updateProgress, setUpdateProgress] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<"Idle" | "Updating" | "Failed" | "Success">("Idle");

  // Home page scanning status
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Delay between when headlights start moving during a wave command
  // const [waveDelay]


  useEffect(() => {
    (async () => {
      const macAddr = await DeviceMACStore.getStoredMAC();
      if (macAddr) setMac(macAddr);
      // TODO: Error handler. Should give warnings for errors with asyncstore
      else { }

      const isOEMCustomButtonEnabled = await CustomOEMButtonStore.isEnabled();
      setOemCustomButtonEnabled(isOEMCustomButtonEnabled);

    })();

    return () => { }
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
        buttonPositive: "OK"
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
        return (granted === PermissionsAndroid.RESULTS.GRANTED);

      } else return await requestAndroid31Permissions();
    } else return true;
  }

  // TODO: Handle erros from these
  const initBLEMonitors = async (connection: Device) => {
    connection.monitorCharacteristicForService(WINK_SERVICE_UUID, BUSY_CHAR_UUID, (err, char) => {
      if (err) return console.log(err);
      const strVal = base64.decode(char?.value!);
      if (parseInt(strVal) === 1) setHeadlightsBusy(true);
      else setHeadlightsBusy(false);
    });

    connection.monitorCharacteristicForService(WINK_SERVICE_UUID, LEFT_STATUS_UUID, (err, char) => {
      if (err) return console.log(err);
      const strVal = base64.decode(char?.value!);
      const intVal = parseInt(strVal);
      if (intVal > 1) {
        const realValDecimal = (intVal - 10) / 100;
        setLeftStatus(realValDecimal);
      } else setLeftStatus(intVal);
    });

    connection.monitorCharacteristicForService(WINK_SERVICE_UUID, RIGHT_STATUS_UUID, (err, char) => {
      if (err) return console.log(err);
      const strVal = base64.decode(char?.value!);
      const intVal = parseInt(strVal);
      if (intVal > 1) {
        const realValDecimal = (intVal - 10) / 100;
        setRightStatus(realValDecimal);
      } else setRightStatus(intVal);
    });

    connection.monitorCharacteristicForService(OTA_SERVICE_UUID, SOFTWARE_UPDATING_CHAR_UUID, (err, char) => {
      if (err) return console.log(err);
      const strVal = base64.decode(char?.value!);
      const val = parseInt(strVal);
      setUpdateProgress(val);
    })

    connection.monitorCharacteristicForService(OTA_SERVICE_UUID, SOFTWARE_STATUS_CHAR_UUID, (err, char) => {
      if (err)
        return console.log(err);

      const statusValue = toProperCase(base64.decode(char?.value!) as "idle" | "updating" | "failed" | "success");
      setUpdatingStatus(statusValue);
    });
  }

  const readInitialBLEStatus = async (connection: Device) => {
    const leftInitStatus = await connection?.readCharacteristicForService(WINK_SERVICE_UUID, LEFT_STATUS_UUID);

    if (leftInitStatus) {
      const strVal = base64.decode(leftInitStatus.value!);
      if (strVal.length < 1) return setLeftStatus(0);
      const intVal = parseInt(strVal);
      if (intVal > 1) {
        const realValDecimal = (intVal - 10) / 100;
        setLeftStatus(realValDecimal);
      } else setLeftStatus(intVal);
    }

    const rightInitStatus = await connection?.readCharacteristicForService(WINK_SERVICE_UUID, RIGHT_STATUS_UUID);
    if (rightInitStatus) {
      const strVal = base64.decode(rightInitStatus?.value!);
      if (strVal.length < 1) return setRightStatus(0);
      const intVal = parseInt(strVal);
      if (intVal > 1) {
        const realValDecimal = (intVal - 10) / 100;
        setRightStatus(realValDecimal);
      } else setRightStatus(intVal);
    }

    const firmware = await connection?.readCharacteristicForService(OTA_SERVICE_UUID, FIRMWARE_UUID);
    if (firmware.value) {
      setFirmwareVersion(base64.decode(firmware.value));
      await FirmwareStore.setFirmwareVersion(base64.decode(firmware.value));
    }
  }


  const connectToBLEDevice = async (dev: Device) => {
    setIsConnecting(true);
    try {
      const connection = await manager.connectToDevice(dev.id);
      await connection.discoverAllServicesAndCharacteristics();

      await DeviceMACStore.setMAC(connection.id);
      setMac(connection.id);

      setDevice(connection);
      setIsConnecting(false);

      await initBLEMonitors(connection);
      await readInitialBLEStatus(connection);

      connection.onDisconnected(async (err, d) => {
        if (err) {
          // TODO: Handle errors
          console.log(err);
          return;
        }

        setDevice(null);
        const autoConnectStatus = await AutoConnectStore.get();
        if (autoConnectStatus) scanForModule();
      });

    } catch (err) {
      // TODO: Handle error
      // (alert user)

      setDevice(null);
      setIsConnecting(false);
      setIsScanning(false);

      const autoConnect = await AutoConnectStore.get();
      if (autoConnect === null) { }
      if (autoConnect) {
        setIsScanning(true);
        await scanForModule();
      }
    }
  }

  const scanForModule = async () => {
    if (device !== null) return;

    setIsScanning(true);
    const deviceMac = await DeviceMACStore.getStoredMAC();

    let deviceFound = false;

    setTimeout(async () => {
      const autoConnectStatus = await AutoConnectStore.get();
      if (autoConnectStatus === null) { /* TODO: Handle error */ }

      if (!deviceFound) {
        await manager.stopDeviceScan().catch(err => console.log(err));

        setIsConnecting(false);
        setIsScanning(false);

        if (autoConnectStatus)
          scanForModule();
      }
    }, SCAN_TIME_SECONDS);

    manager.startDeviceScan(null, {
      allowDuplicates: false,
      callbackType: ScanCallbackType.FirstMatch,
      legacyScan: false,
      scanMode: ScanMode.LowLatency
    }, async (err, deviceToConnect) => {
      if (err) {
        // TODO: Handle scan error
        console.log(err);
      }

      if (deviceToConnect !== null) {
        if (
          deviceToConnect.id === deviceMac ||
          (
            deviceToConnect.serviceUUIDs &&
            deviceToConnect.serviceUUIDs.includes(OTA_SERVICE_UUID) &&
            deviceToConnect.serviceUUIDs.includes(WINK_SERVICE_UUID) &&
            deviceToConnect.serviceUUIDs.includes(MODULE_SETTINGS_SERVICE_UUID)
          )
        ) {
          deviceFound = true;
          await manager.stopDeviceScan();
          setIsScanning(false);
          await connectToBLEDevice(deviceToConnect);
        }
      }
    });
  }

  const disconnectFromModule = async () => {
    const isConnected = await device?.isConnected();
    if (isConnected)
      await device?.cancelConnection();
  }


  const sendDefaultCommand = async (command: number) => {
    if (headlightsBusy) return;

    try {
      await device?.writeCharacteristicWithoutResponseForService(WINK_SERVICE_UUID, HEADLIGHT_CHAR_UUID, base64.encode(command.toString()));
    } catch (err) {
      // TODO: Handle ble command errors
    }

  }

  const sendCustomCommand = async (commandSequence: string) => {

  }

  const sendSleepyEye = async (leftValue: number, rightValue: number) => {

  }

  const sendSyncCommand = async () => {

  }

  const setOEMButtonStatus = async (status: "enable" | "disable") => {
    if (status === "enable") {
      const res = await CustomOEMButtonStore.enable();
      if (res !== null) setOemCustomButtonEnabled(true);
    } else {
      const res = await CustomOEMButtonStore.disable();
      if (res !== null) setOemCustomButtonEnabled(false);
    }

    const newStatus = await CustomOEMButtonStore.isEnabled();

    await device?.writeCharacteristicWithoutResponseForService(MODULE_SETTINGS_SERVICE_UUID, CUSTOM_BUTTON_UPDATE_UUID, base64.encode(newStatus ? "enable" : "disable"));

    return newStatus;
    // return await CustomOEMButtonStore.isEnabled();
  }


  const updateOEMButtonPresets = async (numPresses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, to: ButtonBehaviors) => {

  }

  const updateButtonDelay = async (delay: number) => {
  }

  const updateWaveDelay = async (delay: number) => {
  }

  const enterDeepSleep = async () => {
  }

  const value: BleContextType = useMemo(
    () => ({
      device,
      requestPermissions,
      sendDefaultCommand,
      setOEMButtonStatus,
      scanForModule,
      disconnectFromModule,
      setHeadlightsBusy,
      updatingStatus,
      oemCustomButtonEnabled,
      updateProgress,
      firmwareVersion,
      isConnecting,
      isScanning,
      manager: manager,
      mac,
      rightStatus,
      leftStatus,
      headlightsBusy,
    }),
    [
      device,
      updatingStatus,
      updateProgress,
      firmwareVersion,
      isConnecting,
      isScanning,
      mac,
      rightStatus,
      leftStatus,
      headlightsBusy,
    ],
  );

  return (
    <BleContext.Provider value={value}>
      {children}
    </BleContext.Provider>
  );
};
