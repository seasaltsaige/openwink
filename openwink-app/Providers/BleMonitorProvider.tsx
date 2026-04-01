import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Device } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import { getBLEDescriptors, buttonBehaviorMap, } from '../helper/Constants';
import { CustomOEMButtonStore, CustomWaveStore, FirmwareStore, SleepyEyeStore } from '../Storage';
import { sleep, toProperCase } from '../helper/Functions';
import { HeadlightOrientationStore, ORIENTATION } from '../Storage/HeadlightOrientationStore';
import { HeadlightMovementSpeedStore, SIDE } from '../Storage/HeadlightMovementSpeedStore';
import { DeviceUUIDStore } from '../Storage/DeviceUUIDStore';

export type BleMonitorContextType = {
  // isConnected: boolean;
  headlightsBusy: boolean;
  isSleepyEyeActive: boolean;
  leftStatus: number;
  rightStatus: number;
  updateProgress: number;
  updatingStatus: 'Idle' | 'Updating' | 'Failed' | 'Success' | 'Canceled';
  firmwareVersion: string;
  leftMoveTime: number;
  rightMoveTime: number;
  leftRightSwapped: boolean;
  leftSleepyEye: number;
  rightSleepyEye: number;
  waveDelayMulti: number;
  oemCustomButtonEnabled: boolean;
  headlightBypass: boolean;
  buttonDelay: number;

  startMonitoring: (device: Device, onCustomCommandInterrupt: () => void) => Promise<void>;
  stopMonitoring: () => void;
  readInitialValues: (device: Device) => Promise<void>;
  writeInitialSettings: (device: Device) => Promise<void>;
  updateFirmwareVersion: (version: string) => void;

  setLeftRightSwapped: React.Dispatch<React.SetStateAction<boolean>>;
  setLeftSleepyEye: React.Dispatch<React.SetStateAction<number>>;
  setRightSleepyEye: React.Dispatch<React.SetStateAction<number>>;
  setWaveDelayMulti: React.Dispatch<React.SetStateAction<number>>;
  setButtonDelay: React.Dispatch<React.SetStateAction<number>>;
  setHeadlightBypass: React.Dispatch<React.SetStateAction<boolean>>;
  setOemCustomButtonEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  refreshMonitorStatus: () => Promise<void>
};

export const BleMonitorContext = createContext<BleMonitorContextType | null>(null);

export const useBleMonitor = () => {
  const context = useContext(BleMonitorContext);
  if (!context) {
    throw new Error('useBleMonitor must be used within BleMonitorProvider');
  }
  return context;
};

export const BleMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Characteristic states
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftStatus, setLeftStatus] = useState(0);
  const [rightStatus, setRightStatus] = useState(0);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<'Idle' | 'Updating' | 'Failed' | 'Success' | 'Canceled'>('Idle');
  const [firmwareVersion, setFirmwareVersion] = useState('');

  // Settings state
  const [oemCustomButtonEnabled, setOemCustomButtonEnabled] = useState(false);
  const [headlightBypass, setHeadlightBypass] = useState(false);
  const [buttonDelay, setButtonDelay] = useState(500);
  const [waveDelayMulti, setWaveDelayMulti] = useState(1.0);
  const [leftSleepyEye, setLeftSleepyEye] = useState(50);
  const [rightSleepyEye, setRightSleepyEye] = useState(50);
  const [leftRightSwapped, setLeftRightSwapped] = useState(false);
  const [leftMoveTime, setLeftMoveTime] = useState(625);
  const [rightMoveTime, setRightMoveTime] = useState(625);

  // Track active subscriptions for cleanup
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Load persisted firmware version on mount
  useEffect(() => {
    const storedFirmware = FirmwareStore.getFirmwareVersion();
    if (storedFirmware) {
      setFirmwareVersion(storedFirmware);
    }

    const left = HeadlightMovementSpeedStore.getMotionValue(SIDE.LEFT);
    const right = HeadlightMovementSpeedStore.getMotionValue(SIDE.RIGHT);
    setLeftMoveTime(left);
    setRightMoveTime(right);
  }, []);


  const refreshMonitorStatus = useCallback(async () => {
    const buttonStatus = CustomOEMButtonStore.isEnabled();
    const bypass = CustomOEMButtonStore.isBypassEnabled();
    const bDelay = CustomOEMButtonStore.getDelay();
    const waveMult = CustomWaveStore.getMultiplier();
    const [lSleepy, rSleepy] = [SleepyEyeStore.get("left"), SleepyEyeStore.get("right")];
    const swap = HeadlightOrientationStore.getStatus();

    const firmwareV = FirmwareStore.getFirmwareVersion();
    setFirmwareVersion(firmwareV ?? "");

    setOemCustomButtonEnabled(buttonStatus);
    setHeadlightBypass(bypass);
    setButtonDelay(bDelay);
    setWaveDelayMulti(waveMult);
    setLeftSleepyEye(lSleepy);
    setRightSleepyEye(rSleepy);
    setLeftRightSwapped(swap === ORIENTATION.OUTSIDE);

  }, []);


  // Parse and set status value (handles the special encoding)
  const parseAndSetStatus = useCallback((rawValue: string, setter: (val: number) => void) => {
    if (rawValue.length < 1) {
      setter(0);
      return;
    }

    const intVal = parseInt(rawValue);
    if (isNaN(intVal)) {
      console.warn('Failed to parse status value:', rawValue);
      setter(0);
      return;
    }

    // Handle special encoding: values > 1 are decimals encoded as (val * 100 + 10)
    if (intVal > 1) {
      const realValDecimal = (intVal - 10) / 100;
      setter(realValDecimal);
    } else {
      setter(intVal);
    }
  }, []);

  // Update firmware version (with persistence)
  const updateFirmwareVersion = useCallback((version: string) => {
    setFirmwareVersion(version);
    FirmwareStore.setFirmwareVersion(version);
  }, []);

  // Monitor BUSY characteristic
  const monitorBusy = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("WINK", "BUSY_STATUS"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring BUSY characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const strVal = base64.decode(char.value);
          setHeadlightsBusy(parseInt(strVal) === 1);
        } catch (error) {
          console.error('Error decoding BUSY value:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  // Monitor LEFT_STATUS characteristic
  const monitorLeftStatus = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("WINK", "LEFT_STATUS"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring LEFT_STATUS characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const strVal = base64.decode(char.value);
          parseAndSetStatus(strVal, setLeftStatus);
        } catch (error) {
          console.error('Error decoding LEFT_STATUS value:', error);
        }
      }
    );

    return subscription.remove;
  }, [parseAndSetStatus]);

  // Monitor RIGHT_STATUS characteristic
  const monitorRightStatus = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("WINK", "RIGHT_STATUS"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring RIGHT_STATUS characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const strVal = base64.decode(char.value);
          parseAndSetStatus(strVal, setRightStatus);
        } catch (error) {
          console.error('Error decoding RIGHT_STATUS value:', error);
        }
      }
    );

    return subscription.remove;
  }, [parseAndSetStatus]);

  // Monitor SOFTWARE_UPDATING characteristic (progress)
  const monitorUpdateProgress = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("OTA", "SOFTWARE_UPDATING"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring UPDATE_PROGRESS characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const strVal = base64.decode(char.value);
          const val = parseInt(strVal);
          if (!isNaN(val)) {
            setUpdateProgress(val);
          }
        } catch (error) {
          console.error('Error decoding UPDATE_PROGRESS value:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  // Monitor SOFTWARE_STATUS characteristic
  const monitorUpdateStatus = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring UPDATE_STATUS characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const statusValue = toProperCase(
            base64.decode(char.value) as 'idle' | 'updating' | 'failed' | 'success' | 'canceled'
          );
          setUpdatingStatus(statusValue);
          // Reset progress when either succes or failure
          if (statusValue === "Success" || statusValue === "Failed" || statusValue === "Canceled") {
            setUpdateProgress(0);
            // Reset status after a delay to show success state
            setTimeout(() => setUpdatingStatus('Idle'), 2000);
          }
        } catch (error) {
          console.error('Error decoding UPDATE_STATUS value:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  // Monitor HEADLIGHT_MOTION_IN characteristic
  const monitorMotionValue = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("SETTINGS", "MOTOR_FEEDBACK"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring MOTION_VALUE characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const decoded = base64.decode(char.value);
          const [leftVal, rightVal] = decoded.split("-").map(s => parseInt(s));
          if (!isNaN(leftVal)) setLeftMoveTime(leftVal);
          if (!isNaN(rightVal)) setRightMoveTime(rightVal);
        } catch (error) {
          console.error('Error decoding MOTION_VALUE:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  // Monitor CUSTOM_COMMAND_STATUS characteristic
  const monitorCustomCommandStatus = useCallback(
    (device: Device, onInterrupt: () => void) => {
      const subscription = device.monitorCharacteristicForService(
        ...getBLEDescriptors("WINK", "CUSTOM_COMMAND"),
        (err, char) => {
          if (err) {
            console.error('Error monitoring CUSTOM_COMMAND_STATUS characteristic:', err);
            return;

          }
          if (!char?.value) return;

          try {
            const val = base64.decode(char.value);
            console.log(val);
            if (val === '0') {
              onInterrupt();
            }
          } catch (error) {
            console.error('Error decoding CUSTOM_COMMAND_STATUS value:', error);
          }
        }
      );

      return subscription.remove;
    },
    []
  );

  // Monitor PASSKEY_UUID characteristic (connection status)
  const monitorPasskey = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("SETTINGS", "AUTH"),
      (err, char) => {
        if (err) {
          console.error('Error monitoring PASSKEY_UUID characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const passkeyUpdate = base64.decode(char.value);
          if (passkeyUpdate.length === 0) return;
          DeviceUUIDStore.set(passkeyUpdate);

        } catch (error) {
          console.error('Error decoding PASSKEY_UUID value:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  const monitorSwapStatus = useCallback((device: Device) => {
    const sub = device.monitorCharacteristicForService(
      ...getBLEDescriptors("SETTINGS", "SWAP_ORIENTATION"),
      (err, char) => {
        if (err)
          return console.log("Err Monitoring 'SWAP_ORIENTATION' Char");

        if (!char?.value) return;

        const decoded = base64.decode(char.value);
        if (decoded === "1") {
          setLeftRightSwapped(true);
          HeadlightOrientationStore.enable();
        } else {
          setLeftRightSwapped(false);
          HeadlightOrientationStore.disable();
        }

      }
    );

    return sub.remove;
  }, []);

  // Start monitoring all characteristics
  const startMonitoring = useCallback(
    async (device: Device, onCustomCommandInterrupt: () => void) => {

      try {
        // Set up all monitors and store cleanup functions
        subscriptionsRef.current = [
          monitorBusy(device),
          monitorLeftStatus(device),
          monitorRightStatus(device),
          monitorUpdateProgress(device),
          monitorUpdateStatus(device),
          monitorMotionValue(device),
          monitorPasskey(device),
          monitorSwapStatus(device),
        ];

        // Only add custom command monitor if callback provided

        subscriptionsRef.current.push(
          monitorCustomCommandStatus(device, onCustomCommandInterrupt)
        );

        // setIsConnected(true);
      } catch (error) {
        console.error('Error setting up monitors:', error);
        stopMonitoring();
        throw error;
      }
    },
    [
      monitorBusy,
      monitorLeftStatus,
      monitorRightStatus,
      monitorUpdateProgress,
      monitorUpdateStatus,
      monitorMotionValue,
      monitorPasskey,
      monitorCustomCommandStatus,
    ]
  );

  // Stop all monitoring
  const stopMonitoring = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from monitor:', error);
      }
    });
    subscriptionsRef.current = [];
    // setIsConnected(false);
  }, []);

  const writeInitialSettings = useCallback(async (device: Device) => {

    // Write swap status 
    // Outside orientation is enabled, cabin is disabled.
    const swapOrientation = HeadlightOrientationStore.getStatus() === ORIENTATION.OUTSIDE ? "1" : "0";
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "SWAP_ORIENTATION"),
      base64.encode(swapOrientation),
    );
    setLeftRightSwapped(swapOrientation === "1");

    // Write sleepy eye settings
    const [leftSleepy, rightSleepy] = [SleepyEyeStore.get("left"), SleepyEyeStore.get("right")];
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "SLEEPY_SETTINGS"),
      base64.encode(`${leftSleepy}-${rightSleepy}`),
    );
    setLeftSleepyEye(leftSleepy);
    setRightSleepyEye(rightSleepy);

    // Write wave delay multiplier
    const waveDelay = CustomWaveStore.getMultiplier();
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "HEADLIGHT_MOVE_DELAY"),
      base64.encode(waveDelay.toString()),
    );
    setWaveDelayMulti(waveDelay);

    // Write headlight bypass status
    const headlightBypass = CustomOEMButtonStore.isBypassEnabled();
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "HEADLIGHT_BYPASS"),
      base64.encode(headlightBypass ? "1" : "0"),
    );
    setHeadlightBypass(headlightBypass);

    // Write custom OEM button sequence settings
    // Now, instead of reading, we will be writing all of the stored CustomOEMButton values to the MCU on connection
    const sequences = CustomOEMButtonStore.getAll();
    for (let i = 1; i <= 9; i++) {
      const seq = sequences.find(s => s.numberPresses === i);

      if (!seq) {
        // Remove it from MCU if it doesn't exist in the app
        await device.writeCharacteristicWithoutResponseForService(
          ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
          base64.encode(i.toString()),
        );

        await sleep(20);

        await device.writeCharacteristicWithoutResponseForService(
          ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
          base64.encode("0")
        );

      } else {

        // Send number of button presses to update
        await device.writeCharacteristicWithoutResponseForService(
          ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
          base64.encode(i.toString())
        );

        // Small delay to prevent overwrite
        await sleep(20);

        if (typeof seq.behavior === "string") {
          // Send behavior for that number of presses
          await device.writeCharacteristicWithoutResponseForService(
            ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
            base64.encode(buttonBehaviorMap[seq.behavior].toString())
          );
        } else {
          // Parse to string, NOT including name, as it is unimportant for the module to know
          const commandString = seq.behavior.command?.map(value => value.delay ? `d${value.delay}` : value.transmitValue).join("-");
          await device.writeCharacteristicWithoutResponseForService(
            ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
            base64.encode(commandString!),
          );
        }

      }

      await sleep(20);
    }


    // Write stored delay value
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
      base64.encode("delay"),
    );
    await sleep(20);
    const delay = CustomOEMButtonStore.getDelay();
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
      base64.encode(delay.toString())
    );
    setButtonDelay(delay);


    // Write custom OEM button enabled status
    const customStatus = CustomOEMButtonStore.isEnabled() ? "enable" : "disable";
    await device.writeCharacteristicWithoutResponseForService(
      ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
      base64.encode(customStatus)
    );
  }, []);

  // Read initial values from characteristics
  const readInitialValues = useCallback(
    async (device: Device) => {
      try {

        // Read LEFT_STATUS
        const leftInitStatus = await device.readCharacteristicForService(
          ...getBLEDescriptors("WINK", "LEFT_STATUS"),
        );
        if (leftInitStatus?.value) {
          const strVal = base64.decode(leftInitStatus.value);
          parseAndSetStatus(strVal, setLeftStatus);
        }

        // Read RIGHT_STATUS
        const rightInitStatus = await device.readCharacteristicForService(
          ...getBLEDescriptors("WINK", "RIGHT_STATUS"),
        );
        if (rightInitStatus?.value) {
          const strVal = base64.decode(rightInitStatus.value);
          parseAndSetStatus(strVal, setRightStatus);
        }

        // Read FIRMWARE_VERSION
        const firmware = await device.readCharacteristicForService(
          ...getBLEDescriptors("OTA", "FIRMWARE_VERSION"),
        );
        if (firmware?.value) {
          const version = base64.decode(firmware.value);
          updateFirmwareVersion(version);
        }

        // Read MOTION_VALUE
        const motion = await device.readCharacteristicForService(
          ...getBLEDescriptors("SETTINGS", "MOTOR_FEEDBACK"),
        );
        if (motion?.value) {
          const decoded = base64.decode(motion.value);
          const [leftVal, rightVal] = decoded.split("-").map(s => parseInt(s));
          if (!isNaN(leftVal)) setLeftMoveTime(leftVal);
          if (!isNaN(rightVal)) setRightMoveTime(rightVal);
        }

        // Read SOFTWARE_STATUS 
        // Useful pretty much only in the case of a canceled OTA Update
        // still need to check the case though.
        const status = await device.readCharacteristicForService(
          ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
        );
        if (status?.value) {
          const val = base64.decode(status.value) as any; // not good but i might be lazy
          const proper = toProperCase(val);
          setUpdatingStatus(proper);
          // additionally reset update progress
          setUpdateProgress(0);
        }

      } catch (error) {
        console.error('Error reading initial values:', error);
      }
    },
    [parseAndSetStatus]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const isSleepyEyeActive = (leftStatus === 0 || leftStatus === 1) &&
    (rightStatus === 0 || rightStatus === 1);

  const value: BleMonitorContextType = {
    // isConnected,
    headlightsBusy,
    isSleepyEyeActive,
    leftStatus,
    rightStatus,
    updateProgress,
    updatingStatus,
    firmwareVersion,
    leftMoveTime,
    rightMoveTime,
    leftSleepyEye,
    rightSleepyEye,
    leftRightSwapped,
    waveDelayMulti,
    buttonDelay,
    headlightBypass,
    oemCustomButtonEnabled,

    setButtonDelay,
    setHeadlightBypass,
    setOemCustomButtonEnabled,
    setWaveDelayMulti,
    setLeftRightSwapped,
    setLeftSleepyEye,
    setRightSleepyEye,

    startMonitoring,
    stopMonitoring,
    readInitialValues,
    writeInitialSettings,
    updateFirmwareVersion,
    refreshMonitorStatus,
  };

  return (
    <BleMonitorContext.Provider value={value}>
      {children}
    </BleMonitorContext.Provider>
  );
};
