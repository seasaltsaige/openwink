import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Device } from 'react-native-ble-plx';
import base64, { decode } from 'react-native-base64';
import Toast from 'react-native-toast-message';
import {
  BUSY_CHAR_UUID,
  LEFT_STATUS_UUID,
  RIGHT_STATUS_UUID,
  SOFTWARE_UPDATING_CHAR_UUID,
  SOFTWARE_STATUS_CHAR_UUID,
  HEADLIGHT_MOTION_IN_UUID,
  CUSTOM_COMMAND_UUID,
  PASSKEY_UUID,
  WINK_SERVICE_UUID,
  OTA_SERVICE_UUID,
  MODULE_SETTINGS_SERVICE_UUID,
  FIRMWARE_UUID,
  CUSTOM_BUTTON_UPDATE_UUID,
  buttonBehaviorMapReversed,
  SWAP_ORIENTATION_UUID,
  SLEEPY_SETTINGS_UUID,
  HEADLIGHT_MOVEMENT_DELAY_UUID,
  HEADLIGHT_BYPASS_UUID,
} from '../helper/Constants';
import { CustomCommandStore, CustomOEMButtonStore, CustomWaveStore, FirmwareStore, SleepyEyeStore } from '../Storage';
import { sleep, toProperCase } from '../helper/Functions';
import { CommandInput, CommandOutput, Presses } from '../helper/Types';
import { HeadlightOrientationStore } from '../Storage/HeadlightOrientationStore';
import Storage from '../Storage/Storage';
import { HeadlightMovementSpeedStore, SIDE } from '../Storage/HeadlightMovementSpeedStore';

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

  startMonitoring: (device: Device) => Promise<void>;
  stopMonitoring: () => void;
  readInitialValues: (device: Device) => Promise<void>;
  updateFirmwareVersion: (version: string) => void;

  setLeftRightSwapped: React.Dispatch<React.SetStateAction<boolean>>;
  setLeftSleepyEye: React.Dispatch<React.SetStateAction<number>>;
  setRightSleepyEye: React.Dispatch<React.SetStateAction<number>>;
  setWaveDelayMulti: React.Dispatch<React.SetStateAction<number>>;
  setButtonDelay: React.Dispatch<React.SetStateAction<number>>;
  setHeadlightBypass: React.Dispatch<React.SetStateAction<boolean>>;
  setOemCustomButtonEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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
      WINK_SERVICE_UUID,
      BUSY_CHAR_UUID,
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
      WINK_SERVICE_UUID,
      LEFT_STATUS_UUID,
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
      WINK_SERVICE_UUID,
      RIGHT_STATUS_UUID,
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
      OTA_SERVICE_UUID,
      SOFTWARE_UPDATING_CHAR_UUID,
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
      OTA_SERVICE_UUID,
      SOFTWARE_STATUS_CHAR_UUID,
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

          console.log(statusValue);
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
      MODULE_SETTINGS_SERVICE_UUID,
      HEADLIGHT_MOTION_IN_UUID,
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
        WINK_SERVICE_UUID,
        CUSTOM_COMMAND_UUID,
        (err, char) => {
          if (err) {
            console.error('Error monitoring CUSTOM_COMMAND_STATUS characteristic:', err);
            return;
          }
          if (!char?.value) return;

          try {
            const val = base64.decode(char.value);
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
      MODULE_SETTINGS_SERVICE_UUID,
      PASSKEY_UUID,
      (err, char) => {
        if (err) {
          console.error('Error monitoring PASSKEY_UUID characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const passkeyUpdate = base64.decode(char.value);
          if (passkeyUpdate.length === 0) return;
          Storage.set("device-passkey", passkeyUpdate);
        } catch (error) {
          console.error('Error decoding PASSKEY_UUID value:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  const monitorSwapStatus = useCallback((device: Device) => {
    const sub = device.monitorCharacteristicForService(
      MODULE_SETTINGS_SERVICE_UUID,
      SWAP_ORIENTATION_UUID,
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
    async (device: Device, onCustomCommandInterrupt?: () => void) => {
      // Clean up any existing subscriptions first
      stopMonitoring();

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
        if (onCustomCommandInterrupt) {
          subscriptionsRef.current.push(
            monitorCustomCommandStatus(device, onCustomCommandInterrupt)
          );
        }
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

  // Read initial values from characteristics
  const readInitialValues = useCallback(
    async (device: Device) => {
      try {

        // Read LEFT_STATUS
        const leftInitStatus = await device.readCharacteristicForService(
          WINK_SERVICE_UUID,
          LEFT_STATUS_UUID
        );
        if (leftInitStatus?.value) {
          const strVal = base64.decode(leftInitStatus.value);
          parseAndSetStatus(strVal, setLeftStatus);
        }

        // Read RIGHT_STATUS
        const rightInitStatus = await device.readCharacteristicForService(
          WINK_SERVICE_UUID,
          RIGHT_STATUS_UUID
        );
        if (rightInitStatus?.value) {
          const strVal = base64.decode(rightInitStatus.value);
          parseAndSetStatus(strVal, setRightStatus);
        }

        // Read FIRMWARE_VERSION
        const firmware = await device.readCharacteristicForService(
          OTA_SERVICE_UUID,
          FIRMWARE_UUID
        );
        if (firmware?.value) {
          const version = base64.decode(firmware.value);
          updateFirmwareVersion(version);
        }

        // Read MOTION_VALUE
        const motion = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          HEADLIGHT_MOTION_IN_UUID
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
          OTA_SERVICE_UUID,
          SOFTWARE_STATUS_CHAR_UUID,
        );
        if (status?.value) {
          const val = base64.decode(status.value) as any; // not good but i might be lazy
          const proper = toProperCase(val);
          setUpdatingStatus(proper);
          // additionally reset update progress
          setUpdateProgress(0);
        }

        // Read SWAP_ORIENTATION
        const orientationSwapStatus = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          SWAP_ORIENTATION_UUID,
        );
        if (orientationSwapStatus.value) {
          const decoded = base64.decode(orientationSwapStatus.value);
          console.log(decoded, "orien");
          if (decoded === "1") {
            setLeftRightSwapped(true);
            HeadlightOrientationStore.enable();
          } else {
            setLeftRightSwapped(false);
            HeadlightOrientationStore.disable();
          }
        }

        // Read SLEEPY_SETTINGS
        const sleepyValues = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          SLEEPY_SETTINGS_UUID,
        );
        if (sleepyValues.value) {
          const decoded = base64.decode(sleepyValues.value);
          console.log(decoded, "sleepy");
          const [left, right] = decoded.split("-");
          const leftParsed = parseFloat(left);
          const rightParsed = parseFloat(right);

          setLeftSleepyEye(leftParsed);
          setRightSleepyEye(rightParsed);

          SleepyEyeStore.set("left", leftParsed);
          SleepyEyeStore.set("right", rightParsed);
        }

        // Read HEADLIGHT_MOVEMENT_DELAY
        const waveDelayStatus = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          HEADLIGHT_MOVEMENT_DELAY_UUID,
        );
        if (waveDelayStatus.value) {
          const decoded = base64.decode(waveDelayStatus.value);
          console.log(decoded, "wave");
          const parsed = parseFloat(decoded);

          setWaveDelayMulti(parsed);
          CustomWaveStore.setMultiplier(parsed);
        }

        // Read HEADLIGHT_BYPASS
        const bypassStatus = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          HEADLIGHT_BYPASS_UUID,
        );
        if (bypassStatus.value) {
          const decoded = base64.decode(bypassStatus.value);
          console.log(decoded, "bypass");
          const parsed = decoded === "1";
          setHeadlightBypass(parsed);
          if (parsed)
            CustomOEMButtonStore.enableBypass();
          else
            CustomOEMButtonStore.disableBypass();
        }


        // Read CUSTOM_BUTTON_UPDATE
        // Syncs custom button sequence from mcu to app

        // Fetch custom commands available; Used for displaying command name
        // If command no longer exists, simply display Unknown/Unknown Command
        const customCommands = CustomCommandStore.getAll();
        for (let i = 1; i < 9; i++) {
          const customButtonStatus = await device.readCharacteristicForService(
            MODULE_SETTINGS_SERVICE_UUID,
            CUSTOM_BUTTON_UPDATE_UUID,
          );
          if (!customButtonStatus) break;

          if (customButtonStatus.value) {
            const decoded = base64.decode(customButtonStatus.value);

            // Default Action
            if (!decoded.includes("-")) {
              if (decoded === "0")
                CustomOEMButtonStore.remove(i as Presses);
              else
                //@ts-ignore (not presses lol)
                CustomOEMButtonStore.set(i as Presses, buttonBehaviorMapReversed[parseInt(decoded)]);
            } else {
              // Custom Action. First needs to be parsed into a CommandOutput object
              const actionsParts = decoded.split("-");

              let commandFound = false;
              outer: for (const cmd of customCommands) {
                for (let j = 0; j < cmd.command!.length; j++) {
                  const cmdPart = cmd.command![j];
                  if (
                    cmdPart.delay &&
                    actionsParts[j].startsWith("d") &&
                    cmdPart.delay === parseInt(actionsParts[j].slice(1))
                  ) continue;
                  else if (
                    cmdPart.transmitValue &&
                    cmdPart.transmitValue === parseInt(actionsParts[j])
                  ) continue;
                  else continue outer;
                }
                // If we get to here, we know a command was found
                commandFound = true;
                CustomOEMButtonStore.set(i as Presses, cmd);
                break;
              }

              if (!commandFound) {
                // No custom command found, parse mcu value to commandoutput, just with Unknown Name
                const command: CommandInput[] = actionsParts.map(str => str.includes("d") ? ({ delay: parseInt(str.slice(1)) }) : ({ transmitValue: parseInt(str), }))
                const output: CommandOutput = {
                  name: "Unknown",
                  command,
                }

                CustomOEMButtonStore.set(i as Presses, output);
              }
            }
          }

          await sleep(20);
        }

        // i = 9
        const cbStatus_Delay = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          CUSTOM_BUTTON_UPDATE_UUID,
        );
        if (cbStatus_Delay.value) {
          const decoded = base64.decode(cbStatus_Delay.value);
          console.log(decoded);
          const parsed = parseInt(decoded);
          setButtonDelay(parsed);
          CustomOEMButtonStore.setDelay(parsed);
        }


        // i = 10
        const cbStatus_Enabled = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          CUSTOM_BUTTON_UPDATE_UUID,
        );
        if (cbStatus_Enabled.value) {
          const decoded = base64.decode(cbStatus_Enabled.value);
          console.log(decoded);
          const parsed = decoded === "true";
          setOemCustomButtonEnabled(parsed);
          if (parsed)
            CustomOEMButtonStore.enable();
          else
            CustomOEMButtonStore.disable();
        }


        const swapStatus = await device.readCharacteristicForService(
          MODULE_SETTINGS_SERVICE_UUID,
          SWAP_ORIENTATION_UUID,
        );
        if (swapStatus.value) {
          const swapValue = base64.decode(swapStatus.value);
          if (swapValue === "1")
            HeadlightOrientationStore.enable();
          else
            HeadlightOrientationStore.disable();
        }
      } catch (error) {
        console.error('Error reading initial values:', error);
        // throw error;
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
    updateFirmwareVersion
  };

  return (
    <BleMonitorContext.Provider value={value}>
      {children}
    </BleMonitorContext.Provider>
  );
};
