import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Device } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import Toast from 'react-native-toast-message';
import {
  BUSY_CHAR_UUID,
  LEFT_STATUS_UUID,
  RIGHT_STATUS_UUID,
  SOFTWARE_UPDATING_CHAR_UUID,
  SOFTWARE_STATUS_CHAR_UUID,
  HEADLIGHT_MOTION_IN_UUID,
  CUSTOM_COMMAND_UUID,
  CLIENT_MAC_UUID,
  WINK_SERVICE_UUID,
  OTA_SERVICE_UUID,
  MODULE_SETTINGS_SERVICE_UUID,
  FIRMWARE_UUID,
  CUSTOM_BUTTON_UPDATE_UUID,
  buttonBehaviorMapReversed,
} from '../helper/Constants';
import { CommandOutput, CustomCommandStore, CustomOEMButtonStore, FirmwareStore } from '../Storage';
import { sleep, toProperCase } from '../helper/Functions';
import { Presses } from '../helper/Types';
import { CommandInput } from './BleCommandProvider';

export type BleMonitorContextType = {
  // isConnected: boolean;
  headlightsBusy: boolean;
  isSleepyEyeActive: boolean;
  leftStatus: number;
  rightStatus: number;
  updateProgress: number;
  updatingStatus: 'Idle' | 'Updating' | 'Failed' | 'Success' | 'Canceled';
  firmwareVersion: string;
  motionValue: number;
  startMonitoring: (device: Device) => Promise<void>;
  stopMonitoring: () => void;
  updateFirmwareVersion: (version: string) => void;
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
  const [motionValue, setMotionValue] = useState(750);

  // Track active subscriptions for cleanup
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Load persisted firmware version on mount
  useEffect(() => {
    const storedFirmware = FirmwareStore.getFirmwareVersion();
    if (storedFirmware) {
      setFirmwareVersion(storedFirmware);
    }
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
          const val = base64.decode(char.value);
          const intVal = parseInt(val);
          if (!isNaN(intVal)) {
            setMotionValue(intVal);
          }
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

  // Monitor CLIENT_MAC characteristic (connection status)
  const monitorClientMac = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      MODULE_SETTINGS_SERVICE_UUID,
      CLIENT_MAC_UUID,
      (err, char) => {
        if (err) {
          console.error('Error monitoring CLIENT_MAC characteristic:', err);
          return;
        }
        if (!char?.value) return;

        try {
          const val = parseInt(base64.decode(char.value));

          if (val === 1) {
            Toast.show({
              autoHide: true,
              visibilityTime: 8000,
              text1: 'Module Connected',
              text2: 'Successfully connected to Open Wink Module.',
            });
          } else if (val === 5) {
            Toast.show({
              autoHide: true,
              visibilityTime: 8000,
              text1: 'Module Bonded',
              text2: 'Successfully bonded to new Open Wink Module.',
            });
          }
        } catch (error) {
          console.error('Error decoding CLIENT_MAC value:', error);
        }
      }
    );

    return subscription.remove;
  }, []);

  // Start monitoring all characteristics
  const startMonitoring = useCallback(
    async (device: Device, onCustomCommandInterrupt?: () => void) => {
      // Clean up any existing subscriptions first
      stopMonitoring();

      try {
        // Read initial values before setting up monitors
        await readInitialValues(device);

        // Set up all monitors and store cleanup functions
        subscriptionsRef.current = [
          monitorBusy(device),
          monitorLeftStatus(device),
          monitorRightStatus(device),
          monitorUpdateProgress(device),
          monitorUpdateStatus(device),
          monitorMotionValue(device),
          monitorClientMac(device),
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
      monitorClientMac,
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
          const val = base64.decode(motion.value);
          const intVal = parseInt(val);
          if (!isNaN(intVal)) {
            setMotionValue(intVal);
          }
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
                CustomOEMButtonStore.set(i as Presses, buttonBehaviorMapReversed[parseInt(decoded) as Presses]);
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
      } catch (error) {
        console.error('Error reading initial values:', error);
        throw error;
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
    motionValue,
    startMonitoring,
    stopMonitoring,
    updateFirmwareVersion
  };

  return (
    <BleMonitorContext.Provider value={value}>
      {children}
    </BleMonitorContext.Provider>
  );
};
