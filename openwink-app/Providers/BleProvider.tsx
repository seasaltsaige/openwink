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
import {
  BUSY_CHAR_UUID,
  CUSTOM_BUTTON_UPDATE_UUID,
  FIRMWARE_UUID,
  HEADLIGHT_CHAR_UUID,
  HEADLIGHT_MOTION_IN_UUID,
  HEADLIGHT_MOVEMENT_DELAY_UUID,
  LEFT_STATUS_UUID,
  MODULE_SETTINGS_SERVICE_UUID,
  OTA_SERVICE_UUID,
  RIGHT_STATUS_UUID,
  SCAN_TIME_SECONDS,
  SOFTWARE_STATUS_CHAR_UUID,
  SOFTWARE_UPDATING_CHAR_UUID,
  WINK_SERVICE_UUID,
  ButtonStatus,
  DefaultCommandValue,
  SLEEPY_EYE_UUID,
  SLEEPY_SETTINGS_UUID,
  LONG_TERM_SLEEP_UUID,
  SYNC_UUID,
} from '../helper/Constants';
import { AutoConnectStore, CommandInput, CommandOutput, CustomOEMButtonStore, CustomWaveStore, DeviceMACStore, FirmwareStore, SleepyEyeStore } from '../Storage';

import base64 from 'react-native-base64';
import { PermissionsAndroid, Platform } from 'react-native';
import * as ExpoDevice from "expo-device";
import { sleep, toProperCase } from '../helper/Functions';
import { ButtonBehaviors, Presses } from '../helper/Types';
import { buttonBehaviorMap } from "../helper/Constants";

export type BleContextType = {
  device: Device | null;
  requestPermissions: () => Promise<boolean>;
  scanForModule: () => Promise<void>;
  disconnectFromModule: () => Promise<void>;
  sendDefaultCommand: (command: number) => Promise<void>;
  setHeadlightsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setOEMButtonStatus: (status: "enable" | "disable") => Promise<boolean | undefined>;
  updateWaveDelayMulti: (delayMulti: number) => Promise<void>;
  updateOEMButtonPresets: (numPresses: Presses, to: ButtonBehaviors | 0) => Promise<void>;
  setSleepyEyeValues: (left: number, right: number) => Promise<void>;
  sendSleepyEye: () => Promise<void>;
  sendSyncCommand: () => Promise<void>;
  enterDeepSleep: () => Promise<void>;
  sendCustomCommand: (commandSequence: CommandInput[]) => Promise<void>;
  customCommandInterrupt: () => void;
  waveDelayMulti: number;
  customCommandActive: React.MutableRefObject<boolean>;
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
  leftSleepyEye: number;
  rightSleepyEye: number;
  headlightsBusy: boolean;
  autoConnectEnabled: boolean;
  setAutoConnect: (bool: boolean) => void;
  updateButtonDelay: (delay: number) => Promise<void>;
  buttonDelay: number;
};

export const BleContext = createContext<BleContextType | null>(null);

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const manager = useMemo(() => new BleManager(), []);

  // Connected device
  const [device, setDevice] = useState<Device | null>(null);
  // const [device, setDevice] = useState<Device | null>({} as Device);

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
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const setAutoConnect = (bool: boolean) => { setAutoConnectEnabled(bool) };

  const [buttonDelay, setButtonDelay] = useState(500);
  const [waveDelayMulti, setWaveDelayMulti] = useState(1.0);
  const [motionValue, setMotionValue] = useState(750);

  const [leftSleepyEye, setLeftSleepyEye] = useState(50);
  const [rightSleepyEye, setRightSleepyEye] = useState(50);

  // const [customCommandActive, setCustomCommandActive] = useState(false);
  const customCommandActive = useRef(false);



  useEffect(() => {
    (async () => {
      const macAddr = await DeviceMACStore.getStoredMAC();
      if (macAddr) setMac(macAddr);

      const isOEMCustomButtonEnabled = await CustomOEMButtonStore.isEnabled();
      setOemCustomButtonEnabled(isOEMCustomButtonEnabled);
      const autoConn = await AutoConnectStore.get();
      if (autoConn)
        setAutoConnectEnabled(autoConn);

      const delay = await CustomOEMButtonStore.getDelay();
      if (delay) setButtonDelay(delay);

      const waveMulti = await CustomWaveStore.getMultiplier();
      if (waveMulti) setWaveDelayMulti(waveMulti);

      const firmwareVer = await FirmwareStore.getFirmwareVersion();
      if (firmwareVer) setFirmwareVersion(firmwareVer);

      const left = await SleepyEyeStore.get("left");
      const right = await SleepyEyeStore.get("right");
      if (left) setLeftSleepyEye(left);
      if (right) setRightSleepyEye(right);
    })();

    return () => { }
  }, []);



  // TODO: If denied, should realistically lock user from using app, as it will not behave as expected (no connection)
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
  };

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
      if (err) return console.log(err);
      const statusValue = toProperCase(base64.decode(char?.value!) as "idle" | "updating" | "failed" | "success");
      setUpdatingStatus(statusValue);
    });

    connection.monitorCharacteristicForService(MODULE_SETTINGS_SERVICE_UUID, HEADLIGHT_MOTION_IN_UUID, (err, char) => {
      if (err) return console.log(err);
      const val = base64.decode(char?.value!);
      setMotionValue(parseInt(val));
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


    const motion = await connection.readCharacteristicForService(MODULE_SETTINGS_SERVICE_UUID, HEADLIGHT_MOTION_IN_UUID);
    if (motion.value) {
      const val = base64.decode(motion.value);
      setMotionValue(parseInt(val));
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
      console.log(err);
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
    if (device !== null || isScanning || isConnecting) return;

    setIsScanning(true);
    const deviceMac = await DeviceMACStore.getStoredMAC();

    let deviceFound = false;

    setTimeout(async () => {
      const autoConnectStatus = await AutoConnectStore.get();
      if (autoConnectStatus === null) { /* TODO: Handle error */ }
      else
        setAutoConnectEnabled(autoConnectStatus)

      if (!deviceFound) {
        await manager.stopDeviceScan().catch(err => console.log(err));

        setIsConnecting(false);
        setIsScanning(false);

        if (autoConnectEnabled)
          scanForModule();
      }
    }, SCAN_TIME_SECONDS);

    manager.startDeviceScan(null, {
      allowDuplicates: false,
      callbackType: ScanCallbackType.FirstMatch,
      legacyScan: false,
      scanMode: ScanMode.LowLatency,
    }, async (err, deviceToConnect) => {
      if (err) {
        // TODO: Handle scan error
        console.log(err.androidErrorCode, err.attErrorCode);
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


  const sendDefaultCommand = async (command: DefaultCommandValue) => {
    if (headlightsBusy) return;

    if ((leftStatus === ButtonStatus.UP && command === DefaultCommandValue.LEFT_UP) ||
      (leftStatus === ButtonStatus.DOWN && command === DefaultCommandValue.LEFT_DOWN) ||
      (rightStatus === ButtonStatus.UP && command === DefaultCommandValue.RIGHT_UP) ||
      (rightStatus === ButtonStatus.DOWN && command === DefaultCommandValue.RIGHT_DOWN) ||
      (leftStatus === ButtonStatus.UP && rightStatus === ButtonStatus.UP && command === DefaultCommandValue.BOTH_UP) ||
      (leftStatus === ButtonStatus.DOWN && rightStatus === ButtonStatus.DOWN && command === DefaultCommandValue.BOTH_DOWN)) return;

    try {
      setHeadlightsBusy(true);
      await device?.writeCharacteristicWithoutResponseForService(WINK_SERVICE_UUID, HEADLIGHT_CHAR_UUID, base64.encode(command.toString()));
      if (command === DefaultCommandValue.BOTH_BLINK || command === DefaultCommandValue.LEFT_WINK || command === DefaultCommandValue.RIGHT_WINK)
        setTimeout(() => setHeadlightsBusy(false), motionValue * 2);
      else if (command === DefaultCommandValue.LEFT_WAVE || command === DefaultCommandValue.RIGHT_WAVE) {
        let additionalDelayFromDiff = 0;

        if (leftStatus !== rightStatus) additionalDelayFromDiff = motionValue;

        const toEndMulti = 1.0 - waveDelayMulti;

        setTimeout(() => setHeadlightsBusy(false),
          ((motionValue * waveDelayMulti) * 3) +
          ((motionValue * toEndMulti) * 2) +
          additionalDelayFromDiff
        );

      } else setTimeout(() => setHeadlightsBusy(false), motionValue);
      // setTimeout(() => setHeadlightsBusy(false), )
    } catch (err) {
      setHeadlightsBusy(false);
      // TODO: Handle ble command errors
    }

  }

  const setSleepyEyeValues = async (left: number, right: number) => {
    if (left < 0 || left > 100 || right < 0 || right > 100 || !device) return;

    await SleepyEyeStore.set("left", left);
    await SleepyEyeStore.set("right", right);

    setLeftSleepyEye(left);
    setRightSleepyEye(right);


    const data = `${left}-${right}`;
    await device.writeCharacteristicWithoutResponseForService(MODULE_SETTINGS_SERVICE_UUID, SLEEPY_SETTINGS_UUID, base64.encode(data));
  }

  const sendSleepyEye = async () => {
    if (!device || (leftStatus !== 0 && leftStatus !== 1) || (rightStatus !== 0 && rightStatus !== 1)) return;
    await device.writeCharacteristicWithoutResponseForService(WINK_SERVICE_UUID, SLEEPY_EYE_UUID, base64.encode("1"));
  }

  const sendSyncCommand = async () => {
    if (!device || (leftStatus === 0 || leftStatus == 1) && (rightStatus == 0 || rightStatus == 1)) return;
    await device?.writeCharacteristicWithoutResponseForService(WINK_SERVICE_UUID, SYNC_UUID, base64.encode("1"));
  }

  const sendCustomCommand = async (commandSequence: CommandInput[]) => {
    if (customCommandActive.current) return;
    customCommandActive.current = true;
    setHeadlightsBusy(true);

    for (const part of commandSequence) {
      if (!customCommandActive.current) break;
      if (part.delay)
        await sleep(part.delay);
      else {

        if (part.transmitValue) {
          await device?.writeCharacteristicWithoutResponseForService(
            WINK_SERVICE_UUID,
            HEADLIGHT_CHAR_UUID,
            base64.encode(part.transmitValue.toString()),
          );

          if (part.transmitValue === DefaultCommandValue.BOTH_BLINK || part.transmitValue === DefaultCommandValue.LEFT_WINK || part.transmitValue === DefaultCommandValue.RIGHT_WINK)
            await sleep(motionValue * 2);
          else if (part.transmitValue === DefaultCommandValue.RIGHT_WAVE || part.transmitValue === DefaultCommandValue.LEFT_WAVE) {
            let additionalDelayFromDiff = 0;
            if (leftStatus !== rightStatus) additionalDelayFromDiff = motionValue;
            const toEndMulti = 1.0 - waveDelayMulti;

            const total = ((motionValue * waveDelayMulti) * 3) +
              ((motionValue * toEndMulti) * 2) +
              additionalDelayFromDiff;

            await sleep(total);
          } else await sleep(motionValue);
        }
      }
    }

    customCommandActive.current = false;
  }

  const customCommandInterrupt = () => {
    customCommandActive.current = false;
    setHeadlightsBusy(false);
  }

  const setOEMButtonStatus = async (status: "enable" | "disable") => {
    if (!device) return;

    if (status === "enable") {
      const res = await CustomOEMButtonStore.enable();
      if (res !== null) setOemCustomButtonEnabled(true);
    } else {
      const res = await CustomOEMButtonStore.disable();
      if (res !== null) setOemCustomButtonEnabled(false);
    }

    const newStatus = await CustomOEMButtonStore.isEnabled();

    device.writeCharacteristicWithoutResponseForService(
      MODULE_SETTINGS_SERVICE_UUID,
      CUSTOM_BUTTON_UPDATE_UUID,
      base64.encode(status),
    );

    return newStatus;
  }


  const updateOEMButtonPresets = async (numPresses: Presses, to: ButtonBehaviors | 0) => {
    if (!device) return;

    if (to === 0)
      await CustomOEMButtonStore.remove(numPresses);
    else
      await CustomOEMButtonStore.set(numPresses, to);

    // SET Number of Button Presses to update on ESP Side
    await device.writeCharacteristicWithoutResponseForService(
      MODULE_SETTINGS_SERVICE_UUID,
      CUSTOM_BUTTON_UPDATE_UUID,
      base64.encode(numPresses.toString()),
    );
    // Sleep for small delay to ensure no overwrite
    await sleep(20);

    // SET # presses to given behavior 
    await device.writeCharacteristicWithoutResponseForService(
      MODULE_SETTINGS_SERVICE_UUID,
      CUSTOM_BUTTON_UPDATE_UUID,
      base64.encode(to === 0 ? "0" : buttonBehaviorMap[to].toString()),
    );

  }

  const updateButtonDelay = async (delay: number) => {
    if (!device || delay < 100) return;
    try {
      await CustomOEMButtonStore.setDelay(delay);
      await device.writeCharacteristicWithoutResponseForService(
        MODULE_SETTINGS_SERVICE_UUID,
        CUSTOM_BUTTON_UPDATE_UUID,
        base64.encode(delay.toString()),
      );

      setButtonDelay(delay);
    } catch (err) {
      console.log(err);
    }
  }

  const updateWaveDelayMulti = async (delayMulti: number) => {
    if (!device || delayMulti < 0 || delayMulti > 1) return;
    try {
      await CustomWaveStore.setMultiplier(delayMulti);
      await device.writeCharacteristicWithoutResponseForService(
        MODULE_SETTINGS_SERVICE_UUID,
        HEADLIGHT_MOVEMENT_DELAY_UUID,
        base64.encode(delayMulti.toString()),
      );

      setWaveDelayMulti(delayMulti);
    } catch (err) {
      console.log(err);
    }
  }

  const enterDeepSleep = async () => {
    if (!device) return;
  }

  const value: BleContextType = useMemo(
    () => ({
      device,
      requestPermissions,
      sendCustomCommand,
      sendDefaultCommand,
      setOEMButtonStatus,
      scanForModule,
      disconnectFromModule,
      setHeadlightsBusy,
      updateButtonDelay,
      updateWaveDelayMulti,
      updateOEMButtonPresets,
      sendSyncCommand,
      sendSleepyEye,
      setSleepyEyeValues,
      enterDeepSleep,
      customCommandInterrupt,
      customCommandActive,
      waveDelayMulti,
      leftSleepyEye,
      rightSleepyEye,
      updatingStatus,
      oemCustomButtonEnabled,
      buttonDelay,
      updateProgress,
      firmwareVersion,
      isConnecting,
      isScanning,
      manager,
      mac,
      rightStatus,
      leftStatus,
      headlightsBusy,
      autoConnectEnabled,
      setAutoConnect
    }),
    [
      device,
      customCommandActive,
      updatingStatus,
      updateProgress,
      buttonDelay,
      firmwareVersion,
      isConnecting,
      leftSleepyEye,
      rightSleepyEye,
      isScanning,
      waveDelayMulti,
      oemCustomButtonEnabled,
      autoConnectEnabled,
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