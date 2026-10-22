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
import { getBLEDescriptors, DefaultCommandValue, ButtonStatus, DefaultCommandValueEnglish, buttonBehaviorMap, CANCEL_COMMAND_PAYLOAD, BINDING_DELETE_FLAG, SettingFlag, DebugLevel } from '../helper/Constants';
import {
  AUX_ID,
  AUX_SWITCH_TYPE,
  AuxButtonStore,
  CustomOEMButtonStore,
  CustomWaveStore,
  SleepyEyeStore,
} from '../Storage';
import { bytesToBase64, encodeButtonBinding, encodeCustomCommandSequence, sleep } from '../helper/Functions';
import { ButtonBehaviors, CommandInput, CommandOutput, CustomButtonAction, Presses } from '../helper/Types';
import { useBleConnection } from './BleConnectionProvider';
import { useBleMonitor } from './BleMonitorProvider';
import { HeadlightOrientationStore } from '../Storage/HeadlightOrientationStore';

export type BleCommandContextType = {
  // Command execution
  sendDefaultCommand: (command: DefaultCommandValue) => Promise<void>;
  sendCustomCommand: (name: string | undefined, commandSequence: CommandInput[], looped: boolean) => Promise<void>;
  customCommandInterrupt: () => void;

  // Sync and positioning
  sendSyncCommand: () => Promise<void>;
  sendSleepyEye: () => Promise<void>;
  setSleepyEyeValues: (left: number, right: number) => Promise<void>;

  // OEM button configuration
  setOEMButtonStatus: (status: 'enable' | 'disable') => Promise<boolean | undefined>;
  updateOEMButtonPresets: (numPresses: Presses, updateTo: CustomButtonAction | null) => Promise<void>;
  updateButtonDelay: (delay: number) => Promise<void>;
  setOEMButtonHeadlightBypass: (bypass: boolean) => Promise<void>;

  setAuxiliaryButtonStatus: (status: boolean) => Promise<void>;
  setAuxButton: (aux: AUX_ID, action: ButtonBehaviors | CommandOutput, loop: boolean, type: AUX_SWITCH_TYPE) => Promise<void>;
  // Wave configuration
  updateWaveDelayMulti: (delayMulti: number) => Promise<void>;

  // Module management
  enterDeepSleep: () => Promise<void>;
  resetModule: () => Promise<void>;
  swapLeftRight: () => Promise<void>;
  setModuleDebugLevel: (level: DebugLevel) => Promise<void>;

  // State
  activeCommandName: string | null;
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
    isSleepyEyeActive,
    leftStatus,
    rightStatus,
    leftRightSwapped,
    auxiliaryButtonsEnabled,
    setLeftSleepyEye,
    setRightSleepyEye,
    setOemCustomButtonEnabled,
    setButtonDelay,
    setWaveDelayMulti,
    setLeftRightSwapped,
    setHeadlightBypass,
    setAuxiliaryButtonsEnabled,
    setAux1Action,
    setAux2Action,
    setAux1Loop,
    setAux2Loop,
    setAux1Type,
    setAux2Type,
    setDebugLevel,
    // 
  } = useBleMonitor();



  // Track command execution
  const [activeCommandName, setActiveCommandName] = useState<string | null>(null);
  const activeCommandNameRef = useRef<string | null>(null);

  const updateActiveCommandName = (name: string | null) => {
    setActiveCommandName(name);
    activeCommandNameRef.current = name;
  };

  useEffect(() => {
    if (!headlightsBusy) {
      updateActiveCommandName(null);
    }
  }, [headlightsBusy]);

  // Load persisted settings on mount
  useEffect(() => {
    // TODO: Realistically these should be loaded from the MCU, as it should be the source of truth.
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
          ...getBLEDescriptors("WINK", "DEFAULT_COMMAND"),
          bytesToBase64([command])
        );
      } catch (error) {
        console.error('Error sending default command:', error);

        Toast.show({
          type: 'error',
          text1: 'Command Failed',
          text2: 'Failed to send command to module.',
          visibilityTime: 3000,
        });
      }
    },
    [device, headlightsBusy, shouldBlockCommand]
  );

  // Send a custom command sequence
  const sendCustomCommand = useCallback(
    async (name: string = 'Custom Command', commandSequence: CommandInput[], looped: boolean) => {
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
        const payload = encodeCustomCommandSequence(commandSequence, looped);
        await device.writeCharacteristicWithoutResponseForService(
          ...getBLEDescriptors("WINK", "CUSTOM_COMMAND"),
          bytesToBase64(payload),
        );
      } catch (error) {
        console.error('Error executing custom command:', error);
        Toast.show({
          type: 'error',
          text1: 'Custom Command Failed',
          text2: 'Failed to execute custom command sequence.',
          visibilityTime: 3000,
        });
      }
    },
    [device, headlightsBusy]
  );

  // Interrupt a running custom command
  const customCommandInterrupt = useCallback(() => {
    if (!device || (!activeCommandNameRef.current && !headlightsBusy)) {
      return;
    }

    console.log('Interrupting custom command');

    updateActiveCommandName(null);

    // Notify device to cancel active custom command sequence
    device
      .writeCharacteristicWithoutResponseForService(
        ...getBLEDescriptors("WINK", "CUSTOM_COMMAND"),
        bytesToBase64([CANCEL_COMMAND_PAYLOAD])
      )
      .catch((error) => {
        console.error('Error sending interrupt signal:', error);
      });
  }, [device, headlightsBusy]);

  // Send sync command (align headlights to same position)
  const sendSyncCommand = useCallback(async () => {
    if (!device) {
      console.warn('No device connected');
      return;
    }

    // Only sync if headlights are in sleepy eye position
    if (isSleepyEyeActive) {
      console.log('Headlights not in sleepy eye position, sync blocked');
      return;
    }

    if (headlightsBusy) {
      console.log("Headlights currently busy, sync blocked");
      return;
    }

    try {
      await device.writeCharacteristicWithoutResponseForService(
        ...getBLEDescriptors("WINK", "DEFAULT_COMMAND"),
        bytesToBase64([DefaultCommandValue.SLEEPY_EYE])
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
  }, [device, isSleepyEyeActive, headlightsBusy]);

  // Set sleepy eye values (1-99 for each side)
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

      const clampedLeft = Math.max(1, Math.min(99, Math.round(left)));
      const clampedRight = Math.max(1, Math.min(99, Math.round(right)));

      try {
        // Persist values
        SleepyEyeStore.set('left', clampedLeft);
        SleepyEyeStore.set('right', clampedRight);

        setLeftSleepyEye(clampedLeft);
        setRightSleepyEye(clampedRight);

        // Send to device
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.SLEEPY_EYE, clampedLeft, clampedRight])
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
        ...getBLEDescriptors("WINK", "DEFAULT_COMMAND"),
        bytesToBase64([DefaultCommandValue.SLEEPY_EYE])
      );
    } catch (error) {
      console.error('Error sending sleepy eye command:', error);

      Toast.show({
        type: 'error',
        text1: 'Sleepy Eye Failed',
        text2: 'Failed to activate sleepy eye mode.',
        visibilityTime: 3000,
      });
    }
  }, [device, leftStatus, rightStatus, headlightsBusy]);


  const setAuxiliaryButtonStatus = useCallback(
    async (status: boolean) => {
      if (!device) {
        console.warn("No device connected");
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.AUX_STATUS, status ? 1 : 0]),
        );

        if (status) AuxButtonStore.enable();
        else AuxButtonStore.disable();

        setAuxiliaryButtonsEnabled(status);
      } catch (err) {
        console.log(err);
      }
    },
    [device]
  );

  const setAuxButton = useCallback(
    async (aux: AUX_ID, action: ButtonBehaviors | CommandOutput, loop: boolean, type: AUX_SWITCH_TYPE) => {
      if (!device) {
        console.warn("No device connected");
        return;
      }

      if (!auxiliaryButtonsEnabled) {
        console.warn("Aux Buttons not enabled");
        return;
      }

      try {
        const side = aux === AUX_ID.AUX1 ? 0 : 1;
        const buttonType = type === AUX_SWITCH_TYPE.LATCHING ? 0 : 1;
        const payload = action === "Default Behavior"
          ? [side, BINDING_DELETE_FLAG]
          : [side, buttonType, ...encodeButtonBinding(action, loop)];

        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "AUX_BUTTONS"),
          bytesToBase64(payload),
        );

        AuxButtonStore.setAuxButtonAction(aux, action);
        AuxButtonStore.setAuxButtonLoop(aux, loop);
        AuxButtonStore.setAuxButtonType(aux, type);

        if (aux === AUX_ID.AUX1) {
          setAux1Action(action);
          setAux1Loop(loop);
          setAux1Type(type);
        } else if (aux === AUX_ID.AUX2) {
          setAux2Action(action);
          setAux2Loop(loop);
          setAux2Type(type);
        }

      } catch (err) {
        console.log(err);
      }
    },
    [device, auxiliaryButtonsEnabled],
  );

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

        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.CUSTOM_BUTTON_STATUS, status === 'enable' ? 1 : 0])
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
    async (numPresses: Presses, updateTo: CustomButtonAction | null) => {

      if (!device)
        return console.warn('No device connected');

      try {
        const pos = numPresses - 1;
        if (pos < 0 || pos >= 8) {
          console.error('Invalid OEM button binding position:', pos);
          return;
        }

        if (!updateTo) {
          CustomOEMButtonStore.remove(numPresses);
          CustomOEMButtonStore.setLooping(numPresses, false);

          await device.writeCharacteristicWithResponseForService(
            ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
            bytesToBase64([pos, BINDING_DELETE_FLAG]),
          );
        } else {
          const bindingTarget = updateTo.behaviorHumanReadable
            ? updateTo.behaviorHumanReadable
            : updateTo.customCommand!;
          CustomOEMButtonStore.set(numPresses, bindingTarget);
          CustomOEMButtonStore.setLooping(numPresses, updateTo.looping);

          const payload = [pos, ...encodeButtonBinding(bindingTarget, updateTo.looping)];
          await device.writeCharacteristicWithResponseForService(
            ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
            bytesToBase64(payload),
          );
        }

        Toast.show({
          type: "success",
          text1: "Update Success",
          text2: "Button action presets successfully updated.",
          visibilityTime: 3000,
        });

      } catch (error) {
        console.error('Error updating OEM button presets:', error);

        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Failed to update button presets.',
          visibilityTime: 3000,
        });
      }
    },
    [device]
  );

  const setOEMButtonHeadlightBypass = useCallback(
    async (bypass: boolean) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }
      try {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.HEADLIGHT_BYPASS, bypass ? 1 : 0]),
        );

        if (bypass)
          CustomOEMButtonStore.enableBypass();
        else CustomOEMButtonStore.disableBypass();

        setHeadlightBypass(bypass);

      } catch (err) {
        console.log(err);
      }
    },
    [device]
  )

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

      const clampedDelay = Math.max(100, Math.min(1000, Math.round(delay)));

      try {
        CustomOEMButtonStore.setDelay(clampedDelay);

        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.CUSTOM_BUTTON_DELAY, clampedDelay & 0xff, (clampedDelay >> 8) & 0xff])
        );

        setButtonDelay(clampedDelay);
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

      const waveDelay = Math.max(0, Math.min(100, Math.round(delayMulti * 100)));

      try {
        CustomWaveStore.setMultiplier(delayMulti);

        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.WAVE_DELAY, waveDelay])
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
      await device.writeCharacteristicWithResponseForService(
        ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
        bytesToBase64([SettingFlag.LONG_TERM_SLEEP])
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
      await device.writeCharacteristicWithResponseForService(
        ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
        bytesToBase64([SettingFlag.RESET])
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

  const swapLeftRight = useCallback(
    async () => {
      try {
        const nextSwapped = !leftRightSwapped;
        console.log(`Setting swap value to ${nextSwapped ? "1" : "0"}`);
        await device?.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.ORIENTATION, nextSwapped ? 1 : 0]),
        );
        if (nextSwapped) {
          HeadlightOrientationStore.enable();
        } else {
          HeadlightOrientationStore.disable();
        }
        setLeftRightSwapped(nextSwapped);
      } catch (err) {
        console.log(err);
      }
    }, [device, leftRightSwapped]);

  const setModuleDebugLevel = useCallback(
    async (level: DebugLevel) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (level < DebugLevel.NONE || level > DebugLevel.VERBOSE) {
        console.error('Invalid debug level:', level);
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "DEBUG"),
          bytesToBase64([level]),
        );
        setDebugLevel(level);
      } catch (error) {
        console.error('Error setting module debug level:', error);
        Toast.show({
          type: 'error',
          text1: 'Debug Failed',
          text2: 'Failed to update module debug level.',
          visibilityTime: 3000,
        });
      }
    },
    [device, setDebugLevel],
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
    setOEMButtonHeadlightBypass,
    swapLeftRight,
    setModuleDebugLevel,
    setAuxButton,
    setAuxiliaryButtonStatus,
    activeCommandName,
  };

  return <BleCommandContext.Provider value={value}>{children}</BleCommandContext.Provider>;
};
