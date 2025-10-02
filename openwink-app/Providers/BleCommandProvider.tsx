import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import base64 from 'react-native-base64';
import Toast from 'react-native-toast-message';
import {
  HEADLIGHT_CHAR_UUID,
  CUSTOM_BUTTON_UPDATE_UUID,
  HEADLIGHT_MOVEMENT_DELAY_UUID,
  SLEEPY_EYE_UUID,
  SLEEPY_SETTINGS_UUID,
  LONG_TERM_SLEEP_UUID,
  SYNC_UUID,
  CUSTOM_COMMAND_STATUS_UUID,
  RESET_UUID,
  OTA_UUID,
  WINK_SERVICE_UUID,
  MODULE_SETTINGS_SERVICE_UUID,
  OTA_SERVICE_UUID,
  DefaultCommandValue,
  ButtonStatus,
  buttonBehaviorMap,
  DefaultCommandValueEnglish,
} from '../helper/Constants';
import {
  CustomOEMButtonStore,
  CustomWaveStore,
  SleepyEyeStore,
} from '../Storage';
import { sleep } from '../helper/Functions';
import { ButtonBehaviors, Presses } from '../helper/Types';
import { useBleConnection } from './BleConnectionProvider';
import { useBleMonitor } from './BleMonitorProvider';

export type CommandInput = {
  delay?: number;
  transmitValue?: number;
};

export type BleCommandContextType = {
  // Command execution
  sendDefaultCommand: (command: DefaultCommandValue) => Promise<void>;
  sendCustomCommand: (name: string | undefined, commandSequence: CommandInput[]) => Promise<void>;
  customCommandInterrupt: () => void;
  
  // Sync and positioning
  sendSyncCommand: () => Promise<void>;
  sendSleepyEye: () => Promise<void>;
  setSleepyEyeValues: (left: number, right: number) => Promise<void>;
  
  // OEM button configuration
  setOEMButtonStatus: (status: 'enable' | 'disable') => Promise<boolean | undefined>;
  updateOEMButtonPresets: (numPresses: Presses, to: ButtonBehaviors | 0) => Promise<void>;
  updateButtonDelay: (delay: number) => Promise<void>;
  
  // Wave configuration
  updateWaveDelayMulti: (delayMulti: number) => Promise<void>;
  
  // Module management
  enterDeepSleep: () => Promise<void>;
  resetModule: () => Promise<void>;
  startOTAService: (password: string) => Promise<void>;
  
  // State
  activeCommandName: string | null;
  oemCustomButtonEnabled: boolean;
  buttonDelay: number;
  waveDelayMulti: number;
  leftSleepyEye: number;
  rightSleepyEye: number;
};

export const BleCommandContext = createContext<BleCommandContextType | null>(null);

export const useBleCommand = () => {
  const context = useContext(BleCommandContext);
  if (!context) {
    throw new Error('useBleCommand must be used within BleCommandProvider');
  }
  return context;
};

// Delay constants for animations (in ms)
const COMMAND_BUFFER_DELAY = 75;
const WRITE_OPERATION_DELAY = 20;

export const BleCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { device } = useBleConnection();
  const {
    headlightsBusy,
    leftStatus,
    rightStatus,
    motionValue,
  } = useBleMonitor();

  // Settings state
  const [oemCustomButtonEnabled, setOemCustomButtonEnabled] = useState(false);
  const [buttonDelay, setButtonDelay] = useState(500);
  const [waveDelayMulti, setWaveDelayMulti] = useState(1.0);
  const [leftSleepyEye, setLeftSleepyEye] = useState(50);
  const [rightSleepyEye, setRightSleepyEye] = useState(50);

  // Track command execution
  const [activeCommandName, setActiveCommandName] = useState<string | null>(null);
  const activeCommandNameRef = useRef<string | null>(null);

  const updateActiveCommandName = (name: string | null) => {
    setActiveCommandName(name);
    activeCommandNameRef.current = name;
  };

  // Motion value ref to avoid stale closures
  const motionValueRef = useRef(motionValue);
  const waveDelayMultiRef = useRef(waveDelayMulti);
  const leftStatusRef = useRef(leftStatus);
  const rightStatusRef = useRef(rightStatus);

  // Keep refs in sync
  useEffect(() => {
    motionValueRef.current = motionValue;
  }, [motionValue]);

  useEffect(() => {
    waveDelayMultiRef.current = waveDelayMulti;
  }, [waveDelayMulti]);

  useEffect(() => {
    leftStatusRef.current = leftStatus;
  }, [leftStatus]);

  useEffect(() => {
    rightStatusRef.current = rightStatus;
  }, [rightStatus]);

  // Load persisted settings on mount
  useEffect(() => {
    const isOEMEnabled = CustomOEMButtonStore.isEnabled();
    setOemCustomButtonEnabled(isOEMEnabled);

    const storedDelay = CustomOEMButtonStore.getDelay();
    if (storedDelay) {
      setButtonDelay(storedDelay);
    }

    const storedWaveMulti = CustomWaveStore.getMultiplier();
    if (storedWaveMulti) {
      setWaveDelayMulti(storedWaveMulti);
    }

    const storedLeft = SleepyEyeStore.get('left');
    const storedRight = SleepyEyeStore.get('right');
    if (storedLeft !== null) {
      setLeftSleepyEye(storedLeft);
    }
    if (storedRight !== null) {
      setRightSleepyEye(storedRight);
    }
  }, []);

  // Calculate animation duration for a command
  const calculateAnimationDuration = useCallback(
    (command: DefaultCommandValue): number => {
      const motion = motionValueRef.current;
      const waveMulti = waveDelayMultiRef.current;
      const left = leftStatusRef.current;
      const right = rightStatusRef.current;

      // Blink and wink commands take 2x motion time
      if (
        command === DefaultCommandValue.BOTH_BLINK ||
        command === DefaultCommandValue.LEFT_WINK ||
        command === DefaultCommandValue.RIGHT_WINK
      ) {
        return motion * 2;
      }

      // Wave commands have complex timing
      if (
        command === DefaultCommandValue.LEFT_WAVE ||
        command === DefaultCommandValue.RIGHT_WAVE
      ) {
        let additionalDelayFromDiff = 0;
        if (left !== right) {
          additionalDelayFromDiff = motion;
        }

        const toEndMulti = 1.0 - waveMulti;
        return (
          motion * waveMulti * 3 +
          motion * toEndMulti * 2 +
          additionalDelayFromDiff
        );
      }

      // Default commands take 1x motion time
      return motion;
    },
    []
  );

  // Check if command should be blocked (already in target position)
  const shouldBlockCommand = useCallback(
    (command: DefaultCommandValue): boolean => {
      if (
        (leftStatus === ButtonStatus.UP && command === DefaultCommandValue.LEFT_UP) ||
        (leftStatus === ButtonStatus.DOWN && command === DefaultCommandValue.LEFT_DOWN) ||
        (rightStatus === ButtonStatus.UP && command === DefaultCommandValue.RIGHT_UP) ||
        (rightStatus === ButtonStatus.DOWN && command === DefaultCommandValue.RIGHT_DOWN) ||
        (leftStatus === ButtonStatus.UP &&
          rightStatus === ButtonStatus.UP &&
          command === DefaultCommandValue.BOTH_UP) ||
        (leftStatus === ButtonStatus.DOWN &&
          rightStatus === ButtonStatus.DOWN &&
          command === DefaultCommandValue.BOTH_DOWN)
      ) {
        return true;
      }
      return false;
    },
    [leftStatus, rightStatus]
  );

  // Send a default command (wink, wave, up, down, etc.)
  const sendDefaultCommand = useCallback(
    async (command: DefaultCommandValue) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (headlightsBusy) {
        console.log('Headlights busy, command blocked');
        return;
      }

      if (shouldBlockCommand(command)) {
        console.log('Command blocked - already in target position');
        return;
      }

      const commandName = DefaultCommandValueEnglish[command - 1];

      try {
        updateActiveCommandName(commandName);

        await device.writeCharacteristicWithoutResponseForService(
          WINK_SERVICE_UUID,
          HEADLIGHT_CHAR_UUID,
          base64.encode(command.toString())
        );

        const animationDuration = calculateAnimationDuration(command);

        // Release busy state after animation completes
        setTimeout(() => {
          updateActiveCommandName(null);
        }, animationDuration);
      } catch (error) {
        console.error('Error sending default command:', error);
        updateActiveCommandName(null);

        Toast.show({
          type: 'error',
          text1: 'Command Failed',
          text2: 'Failed to send command to module.',
          visibilityTime: 3000,
        });
      }
    },
    [device, headlightsBusy, shouldBlockCommand, calculateAnimationDuration]
  );

  // Send a custom command sequence
  const sendCustomCommand = useCallback(
    async (name: string = 'Custom Command', commandSequence: CommandInput[]) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (headlightsBusy) {
        console.log('Headlights busy, command blocked');
        return;
      }
      if (commandSequence.length === 0) {
        console.log('Empty command sequence');
        return;
      }

      updateActiveCommandName(name);

      try {
        // Alert device that custom command is in progress
        await device.writeCharacteristicWithoutResponseForService(
          WINK_SERVICE_UUID,
          CUSTOM_COMMAND_STATUS_UUID,
          base64.encode('1')
        );

        // Execute each part of the sequence
        for (const part of commandSequence) {
          // Check if interrupted
          if (activeCommandNameRef.current !== name) {
            console.log('Custom command interrupted');
            break;
          }

          if (part.delay) {
            // Simple delay
            await sleep(part.delay);
          } else if (part.transmitValue) {
            // Send command
            await device.writeCharacteristicWithoutResponseForService(
              WINK_SERVICE_UUID,
              HEADLIGHT_CHAR_UUID,
              base64.encode(part.transmitValue.toString())
            );

            // Wait for animation to complete
            const animationDuration = calculateAnimationDuration(part.transmitValue);
            await sleep(animationDuration);
          }

          // Buffer between commands
          await sleep(COMMAND_BUFFER_DELAY);
        }

        // Mark custom command as complete
        await device.writeCharacteristicWithoutResponseForService(
          WINK_SERVICE_UUID,
          CUSTOM_COMMAND_STATUS_UUID,
          base64.encode('0')
        );
      } catch (error) {
        console.error('Error executing custom command:', error);

        Toast.show({
          type: 'error',
          text1: 'Custom Command Failed',
          text2: 'Failed to execute custom command sequence.',
          visibilityTime: 3000,
        });
      } finally {
        updateActiveCommandName(null);
      }
    },
    [device, calculateAnimationDuration]
  );

  // Interrupt a running custom command
  const customCommandInterrupt = useCallback(() => {
    if (!device || !activeCommandNameRef.current) {
      return;
    }

    console.log('Interrupting custom command');

    updateActiveCommandName(null);

    // Notify device that command is no longer in progress
    device
      .writeCharacteristicWithoutResponseForService(
        WINK_SERVICE_UUID,
        CUSTOM_COMMAND_STATUS_UUID,
        base64.encode('0')
      )
      .catch((error) => {
        console.error('Error sending interrupt signal:', error);
      });
  }, [device]);

  // Send sync command (align headlights to same position)
  const sendSyncCommand = useCallback(async () => {
    if (!device) {
      console.warn('No device connected');
      return;
    }

    // Only sync if headlights are in different positions
    if (leftStatus === rightStatus) {
      console.log('Headlights already aligned');
      return;
    }

    try {
      await device.writeCharacteristicWithoutResponseForService(
        WINK_SERVICE_UUID,
        SYNC_UUID,
        base64.encode('1')
      );
    } catch (error) {
      console.error('Error sending sync command:', error);

      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Failed to sync headlights.',
        visibilityTime: 3000,
      });
    }
  }, [device, leftStatus, rightStatus]);

  // Set sleepy eye values (0-100 for each side)
  const setSleepyEyeValues = useCallback(
    async (left: number, right: number) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (left < 0 || left > 100 || right < 0 || right > 100) {
        console.error('Invalid sleepy eye values. Must be between 0-100.');
        return;
      }

      try {
        // Persist values
        SleepyEyeStore.set('left', left);
        SleepyEyeStore.set('right', right);

        setLeftSleepyEye(left);
        setRightSleepyEye(right);

        // Send to device
        const data = `${left}-${right}`;
        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          SLEEPY_SETTINGS_UUID,
          base64.encode(data)
        );
      } catch (error) {
        console.error('Error setting sleepy eye values:', error);

        Toast.show({
          type: 'error',
          text1: 'Settings Failed',
          text2: 'Failed to update sleepy eye settings.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  // Activate sleepy eye mode
  const sendSleepyEye = useCallback(async () => {
    if (!device) {
      console.warn('No device connected');
      return;
    }

    if (headlightsBusy) {
      console.log('Headlights busy, command blocked');
      return;
    }

    // Only allow if both headlights are fully up or down
    if ((leftStatus !== 0 && leftStatus !== 1) || (rightStatus !== 0 && rightStatus !== 1)) {
      console.log('Headlights must be fully up or down for sleepy eye');
      return;
    }

    updateActiveCommandName('Sleepy Eye');

    try {
      await device.writeCharacteristicWithoutResponseForService(
        WINK_SERVICE_UUID,
        SLEEPY_EYE_UUID,
        base64.encode('1')
      );
    } catch (error) {
      console.error('Error sending sleepy eye command:', error);

      Toast.show({
        type: 'error',
        text1: 'Sleepy Eye Failed',
        text2: 'Failed to activate sleepy eye mode.',
        visibilityTime: 3000,
      });
    } finally {
      updateActiveCommandName(null);
    }
  }, [device, leftStatus, rightStatus]);

  // Enable/disable OEM button control
  const setOEMButtonStatus = useCallback(
    async (status: 'enable' | 'disable') => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      try {
        if (status === 'enable') {
          const result = CustomOEMButtonStore.enable();
          if (result !== null) {
            setOemCustomButtonEnabled(true);
          }
        } else {
          const result = CustomOEMButtonStore.disable();
          if (result !== null) {
            setOemCustomButtonEnabled(false);
          }
        }

        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          CUSTOM_BUTTON_UPDATE_UUID,
          base64.encode(status)
        );

        const newStatus = CustomOEMButtonStore.isEnabled();
        return newStatus;
      } catch (error) {
        console.error('Error setting OEM button status:', error);

        Toast.show({
          type: 'error',
          text1: 'Settings Failed',
          text2: 'Failed to update OEM button settings.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  // Update OEM button preset for specific number of presses
  const updateOEMButtonPresets = useCallback(
    async (numPresses: Presses, to: ButtonBehaviors | 0) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      try {
        // Update local storage
        if (to === 0) {
          CustomOEMButtonStore.remove(numPresses);
        } else {
          CustomOEMButtonStore.set(numPresses, to);
        }

        // Send number of button presses to update
        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          CUSTOM_BUTTON_UPDATE_UUID,
          base64.encode(numPresses.toString())
        );

        // Small delay to prevent overwrite
        await sleep(WRITE_OPERATION_DELAY);

        // Send behavior for that number of presses
        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          CUSTOM_BUTTON_UPDATE_UUID,
          base64.encode(to === 0 ? '0' : buttonBehaviorMap[to].toString())
        );
      } catch (error) {
        console.error('Error updating OEM button presets:', error);

        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Failed to update button preset.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  // Update button delay (debounce time)
  const updateButtonDelay = useCallback(
    async (delay: number) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (delay < 100) {
        console.error('Button delay must be at least 100ms');
        return;
      }

      try {
        CustomOEMButtonStore.setDelay(delay);

        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          CUSTOM_BUTTON_UPDATE_UUID,
          base64.encode(delay.toString())
        );

        setButtonDelay(delay);
      } catch (error) {
        console.error('Error updating button delay:', error);

        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Failed to update button delay.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  // Update wave delay multiplier (0.0 - 1.0)
  const updateWaveDelayMulti = useCallback(
    async (delayMulti: number) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (delayMulti < 0 || delayMulti > 1) {
        console.error('Wave delay multiplier must be between 0.0 and 1.0');
        return;
      }

      try {
        CustomWaveStore.setMultiplier(delayMulti);

        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          HEADLIGHT_MOVEMENT_DELAY_UUID,
          base64.encode(delayMulti.toString())
        );

        setWaveDelayMulti(delayMulti);
      } catch (error) {
        console.error('Error updating wave delay:', error);

        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Failed to update wave delay.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  // Enter deep sleep mode (module powers down)
  const enterDeepSleep = useCallback(async () => {
    if (!device) {
      console.warn('No device connected');
      return;
    }

    try {
      await device.writeCharacteristicWithoutResponseForService(
        MODULE_SETTINGS_SERVICE_UUID,
        LONG_TERM_SLEEP_UUID,
        base64.encode('0')
      );

      // Module will disconnect after entering sleep
      await device.cancelConnection().catch((err) => {
        console.log('Disconnect after sleep:', err);
      });

      Toast.show({
        type: 'info',
        text1: 'Module Sleeping',
        text2: 'Module has entered deep sleep mode.',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Error entering deep sleep:', error);

      Toast.show({
        type: 'error',
        text1: 'Sleep Failed',
        text2: 'Failed to enter deep sleep mode.',
        visibilityTime: 3000,
      });
    }
  }, [device]);

  // Reset module to factory settings
  const resetModule = useCallback(async () => {
    if (!device) {
      console.warn('No device connected');
      return;
    }

    try {
      await device.writeCharacteristicWithoutResponseForService(
        MODULE_SETTINGS_SERVICE_UUID,
        RESET_UUID,
        base64.encode('0')
      );

      Toast.show({
        type: 'success',
        text1: 'Module Reset',
        text2: 'Module has been reset to factory settings.',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Error resetting module:', error);

      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: 'Failed to reset module.',
        visibilityTime: 3000,
      });
    }
  }, [device]);

  // Start OTA (Over-The-Air) firmware update service
  const startOTAService = useCallback(
    async (password: string) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      try {
        await device.writeCharacteristicWithoutResponseForService(
          OTA_SERVICE_UUID,
          OTA_UUID,
          base64.encode(password)
        );

        // Wait for OTA service to initialize
        await sleep(1500);

        Toast.show({
          type: 'info',
          text1: 'OTA Service Started',
          text2: 'Ready to receive firmware update.',
          visibilityTime: 3000,
        });
      } catch (error) {
        console.error('Error starting OTA service:', error);

        Toast.show({
          type: 'error',
          text1: 'OTA Failed',
          text2: 'Failed to start OTA service.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  const value: BleCommandContextType = {
    sendDefaultCommand,
    sendCustomCommand,
    customCommandInterrupt,
    sendSyncCommand,
    sendSleepyEye,
    setSleepyEyeValues,
    setOEMButtonStatus,
    updateOEMButtonPresets,
    updateButtonDelay,
    updateWaveDelayMulti,
    enterDeepSleep,
    resetModule,
    startOTAService,
    activeCommandName,
    oemCustomButtonEnabled,
    buttonDelay,
    waveDelayMulti,
    leftSleepyEye,
    rightSleepyEye,
  };

  return <BleCommandContext.Provider value={value}>{children}</BleCommandContext.Provider>;
};
