import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Device } from "react-native-ble-plx";
import base64 from "react-native-base64";
import { BINDING_DELETE_FLAG, DebugLevel, getBLEDescriptors, SettingFlag } from "../helper/Constants";
import {
  AUX_ID,
  AUX_SWITCH_TYPE,
  AuxButtonStore,
  CustomOEMButtonStore,
  CustomWaveStore,
  DeviceMACStore,
  FirmwareStore,
  SleepyEyeStore,
} from "../Storage";
import { base64ToBytes, bytesToBase64, encodeButtonBinding, getDevicePasskey, sleep, toProperCase } from "../helper/Functions";
import {
  HeadlightOrientationStore,
  ORIENTATION,
} from "../Storage/HeadlightOrientationStore";
import {
  HeadlightMovementSpeedStore,
  SIDE,
} from "../Storage/HeadlightMovementSpeedStore";
import { DeviceUUIDStore } from "../Storage/DeviceUUIDStore";
import { ButtonBehaviors, CommandOutput, DebugLogEntry, ErrorTypes, Presses, UpdatingStatus } from "../helper/Types";
import Toast from "react-native-toast-message";
import { OTA } from "../helper/Handlers/OTA";

const MAX_DEBUG_LOGS = 500;

export type BleMonitorContextType = {
  // isConnected: boolean;
  headlightsBusy: boolean;
  isSleepyEyeActive: boolean;
  leftStatus: number;
  rightStatus: number;
  updateProgress: number;
  updatingStatus: UpdatingStatus;
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

  auxiliaryButtonsEnabled: boolean;
  aux1Action: CommandOutput | ButtonBehaviors;
  aux2Action: CommandOutput | ButtonBehaviors;
  aux1Loop: boolean;
  aux2Loop: boolean;
  aux1Type: AUX_SWITCH_TYPE;
  aux2Type: AUX_SWITCH_TYPE;

  startMonitoring: (
    device: Device,
    onCustomCommandInterrupt: () => void,
    onReset: () => Promise<void>,
  ) => Promise<void>;
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
  setFirmwareVersion: React.Dispatch<React.SetStateAction<string>>;
  setOemCustomButtonEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setAuxiliaryButtonsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setAux1Action: React.Dispatch<React.SetStateAction<CommandOutput | ButtonBehaviors>>;
  setAux2Action: React.Dispatch<React.SetStateAction<CommandOutput | ButtonBehaviors>>;
  setAux1Loop: React.Dispatch<React.SetStateAction<boolean>>;
  setAux2Loop: React.Dispatch<React.SetStateAction<boolean>>;
  setAux1Type: React.Dispatch<React.SetStateAction<AUX_SWITCH_TYPE>>
  setAux2Type: React.Dispatch<React.SetStateAction<AUX_SWITCH_TYPE>>
  debugLevel: DebugLevel;
  debugLogs: DebugLogEntry[];
  setDebugLevel: React.Dispatch<React.SetStateAction<DebugLevel>>;
  clearDebugLogs: () => void;
  refreshMonitorStatus: () => Promise<void>;
};

export const BleMonitorContext = createContext<BleMonitorContextType | null>(null);

export const useBleMonitor = () => {
  const context = useContext(BleMonitorContext);
  if (!context) {
    throw new Error("useBleMonitor must be used within BleMonitorProvider");
  }
  return context;
};

export const BleMonitorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Characteristic states
  const [headlightsBusy, setHeadlightsBusy] = useState(false);
  const [leftStatus, setLeftStatus] = useState(0);
  const [rightStatus, setRightStatus] = useState(0);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(UpdatingStatus.IDLE);
  const [firmwareVersion, setFirmwareVersion] = useState(
    () => FirmwareStore.getFirmwareVersion() ?? "",
  );

  // Settings state (initialized directly from MMKV stores for immediate offline consistency)
  const [oemCustomButtonEnabled, setOemCustomButtonEnabled] = useState(() =>
    CustomOEMButtonStore.isEnabled(),
  );
  const [headlightBypass, setHeadlightBypass] = useState(() =>
    CustomOEMButtonStore.isBypassEnabled(),
  );
  const [buttonDelay, setButtonDelay] = useState(() =>
    CustomOEMButtonStore.getDelay(),
  );
  const [waveDelayMulti, setWaveDelayMulti] = useState(() =>
    CustomWaveStore.getMultiplier(),
  );
  const [leftSleepyEye, setLeftSleepyEye] = useState(() =>
    SleepyEyeStore.get("left"),
  );
  const [rightSleepyEye, setRightSleepyEye] = useState(() =>
    SleepyEyeStore.get("right"),
  );
  const [leftRightSwapped, setLeftRightSwapped] = useState(
    () => HeadlightOrientationStore.getStatus() === ORIENTATION.OUTSIDE,
  );
  const [leftMoveTime, setLeftMoveTime] = useState(() =>
    HeadlightMovementSpeedStore.getMotionValue(SIDE.LEFT),
  );
  const [rightMoveTime, setRightMoveTime] = useState(() =>
    HeadlightMovementSpeedStore.getMotionValue(SIDE.RIGHT),
  );

  const [auxiliaryButtonsEnabled, setAuxiliaryButtonsEnabled] = useState(() =>
    AuxButtonStore.getStatus(),
  );
  const [aux1Action, setAux1Action] = useState<CommandOutput | ButtonBehaviors>(
    () => AuxButtonStore.getAuxButtonAction(AUX_ID.AUX1),
  );
  const [aux2Action, setAux2Action] = useState<CommandOutput | ButtonBehaviors>(
    () => AuxButtonStore.getAuxButtonAction(AUX_ID.AUX2),
  );
  const [aux1Loop, setAux1Loop] = useState(() =>
    AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX1),
  );
  const [aux2Loop, setAux2Loop] = useState(() =>
    AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX2),
  );
  const [aux1Type, setAux1Type] = useState(() =>
    AuxButtonStore.getAuxButtonType(AUX_ID.AUX1),
  );
  const [aux2Type, setAux2Type] = useState(() =>
    AuxButtonStore.getAuxButtonType(AUX_ID.AUX2),
  );

  const [debugLevel, setDebugLevel] = useState<DebugLevel>(DebugLevel.NONE);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const debugLogIdRef = useRef(0);
  const debugLineBufferRef = useRef("");
  const pendingDebugLogsRef = useRef<DebugLogEntry[]>([]);
  const debugFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingDebugLogs = useCallback(() => {
    debugFlushTimerRef.current = null;
    if (pendingDebugLogsRef.current.length === 0) return;

    const queued = pendingDebugLogsRef.current;
    pendingDebugLogsRef.current = [];

    setDebugLogs((prev) => {
      const next = [...prev, ...queued];
      if (next.length > MAX_DEBUG_LOGS) {
        return next.slice(next.length - MAX_DEBUG_LOGS);
      }
      return next;
    });
  }, []);

  const clearDebugLogs = useCallback(() => {
    if (debugFlushTimerRef.current) {
      clearTimeout(debugFlushTimerRef.current);
      debugFlushTimerRef.current = null;
    }
    pendingDebugLogsRef.current = [];
    setDebugLogs([]);
    debugLineBufferRef.current = "";
  }, []);


  // Track active subscriptions for cleanup
  const subscriptionsRef = useRef<(() => void)[]>([]);
  const settingsSyncChainRef = useRef<Promise<void>>(Promise.resolve());


  const refreshMonitorStatus = useCallback(async () => {
    const buttonStatus = CustomOEMButtonStore.isEnabled();
    const bypass = CustomOEMButtonStore.isBypassEnabled();
    const bDelay = CustomOEMButtonStore.getDelay();
    const waveMult = CustomWaveStore.getMultiplier();
    const [lSleepy, rSleepy] = [
      SleepyEyeStore.get("left"),
      SleepyEyeStore.get("right"),
    ];
    const swap = HeadlightOrientationStore.getStatus();

    const auxButtonEnabled = AuxButtonStore.getStatus();
    const aux1 = AuxButtonStore.getAuxButtonAction(AUX_ID.AUX1);
    const aux2 = AuxButtonStore.getAuxButtonAction(AUX_ID.AUX2);
    const loop1 = AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX1);
    const loop2 = AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX2);
    const type1 = AuxButtonStore.getAuxButtonType(AUX_ID.AUX1);
    const type2 = AuxButtonStore.getAuxButtonType(AUX_ID.AUX2);

    const firmwareV = FirmwareStore.getFirmwareVersion();
    setFirmwareVersion(firmwareV ?? "");

    setOemCustomButtonEnabled(buttonStatus);
    setAuxiliaryButtonsEnabled(auxButtonEnabled);
    setAux1Action(aux1);
    setAux2Action(aux2);
    setAux1Loop(loop1);
    setAux2Loop(loop2);
    setAux1Type(type1);
    setAux2Type(type2);
    setHeadlightBypass(bypass);
    setButtonDelay(bDelay);
    setWaveDelayMulti(waveMult);
    setLeftSleepyEye(lSleepy);
    setRightSleepyEye(rSleepy);
    setLeftRightSwapped(swap === ORIENTATION.OUTSIDE);
    setLeftMoveTime(HeadlightMovementSpeedStore.getMotionValue(SIDE.LEFT));
    setRightMoveTime(HeadlightMovementSpeedStore.getMotionValue(SIDE.RIGHT));
  }, []);



  // Parse and set packed 7-byte HEADLIGHT_STATUS payload:
  // [busy (1B), left_pos (1B), right_pos (1B), left_move_time (2B LE), right_move_time (2B LE)]
  const parseAndSetHeadlightStatus = useCallback((encodedValue: string) => {
    const bytes = base64ToBytes(encodedValue);
    if (bytes.length < 7) {
      console.warn("Invalid HEADLIGHT_STATUS packet length:", bytes.length);
      return;
    }

    const busy = bytes[0] === 1;
    const leftPos = bytes[1] / 100;
    const rightPos = bytes[2] / 100;
    const leftMove = bytes[3] | (bytes[4] << 8);
    const rightMove = bytes[5] | (bytes[6] << 8);

    setHeadlightsBusy(busy);
    setLeftStatus(leftPos);
    setRightStatus(rightPos);

    if (leftMove > 0) {
      setLeftMoveTime(leftMove);
      HeadlightMovementSpeedStore.setMotionValue(SIDE.LEFT, leftMove);
    }
    if (rightMove > 0) {
      setRightMoveTime(rightMove);
      HeadlightMovementSpeedStore.setMotionValue(SIDE.RIGHT, rightMove);
    }
  }, []);

  // Update firmware version (with persistence)
  const updateFirmwareVersion = useCallback((version: string) => {
    setFirmwareVersion(version);
    FirmwareStore.setFirmwareVersion(version);
  }, []);

  // Monitor HEADLIGHT_STATUS characteristic
  const monitorHeadlightStatus = useCallback(
    (device: Device) => {
      const subscription = device.monitorCharacteristicForService(
        ...getBLEDescriptors("WINK", "HEADLIGHT_STATUS"),
        (err, char) => {
          if (err) {
            console.error("Error monitoring HEADLIGHT_STATUS characteristic:", err);
            return;
          }
          if (!char?.value) return;

          try {
            parseAndSetHeadlightStatus(char.value);
          } catch (error) {
            console.error("Error decoding HEADLIGHT_STATUS value:", error);
          }
        },
      );

      return subscription.remove;
    },
    [parseAndSetHeadlightStatus],
  );

  // Monitor SOFTWARE_UPDATING characteristic (progress: 1-byte uint8 [0..100])
  const monitorUpdateProgress = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("OTA", "SOFTWARE_UPDATING"),
      (err, char) => {
        if (err) {
          console.error(
            "Error monitoring UPDATE_PROGRESS characteristic:",
            err,
          );
          return;
        }
        if (!char?.value) return;

        try {
          const bytes = base64ToBytes(char.value);
          if (bytes.length >= 1) {
            setUpdateProgress(bytes[0]);
          }
        } catch (error) {
          console.error("Error decoding UPDATE_PROGRESS value:", error);
        }
      },
    );

    return subscription.remove;
  }, []);

  // Monitor SOFTWARE_STATUS characteristic (status: 1-byte uint8 UpdatingStatus)
  const monitorUpdateStatus = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
      (err, char) => {
        if (err) {
          console.error("Error monitoring UPDATE_STATUS characteristic:", err);
          return;
        }
        if (!char?.value) return;

        try {
          const bytes = base64ToBytes(char.value);
          if (bytes.length < 1) return;
          const statusValue = bytes[0] as UpdatingStatus;

          setUpdatingStatus(statusValue);

          // Reset progress when either succes or failure
          if (
            statusValue !== UpdatingStatus.UPDATING &&
            statusValue !== UpdatingStatus.IDLE
          ) {
            setUpdateProgress(0);

            // Error with flash init for OTA update
            if (statusValue === UpdatingStatus.ERROR_FLASH_INIT) {
              Toast.show({
                type: "error",
                text1: "Update Error",
                text2: `Something went wrong while initializing the update. Please try again. (${ErrorTypes.ota_flash_init})`,
                visibilityTime: 10000,
              });

              OTA.cancelUpdate();
              // Initialization of the signature verification service failed
            } else if (statusValue === UpdatingStatus.ERROR_VERIFICATION_INIT) {
              Toast.show({
                type: "error",
                text1: "Update Error",
                text2: `Something went wrong while initializing the update. Please try again. (${ErrorTypes.ota_verification_init})`,
                visibilityTime: 10000,
              });

              OTA.cancelUpdate();
              // After download, expected size vs actual size differs
            } else if (statusValue === UpdatingStatus.ERROR_INVALID_SIZE) {

              Toast.show({
                type: "error",
                text1: "Update Error",
                text2: `Expected update size differs from received update size. Please try again. (${ErrorTypes.ota_invalid_size})`,
                visibilityTime: 10000,
              });
              OTA.cancelUpdate();
              // AFter download, the signature verification failed (corruption, differing, modified, etc)
            } else if (statusValue === UpdatingStatus.ERROR_VERIFICATION_SIGN) {

              Toast.show({
                type: "error",
                text1: "Update Error",
                text2: `Something went wrong while verifying the firmware signature. Please report this error. (${ErrorTypes.ota_verification_sign})`,
                visibilityTime: 10000,
              });
              OTA.cancelUpdate();
            } else if (statusValue === UpdatingStatus.ERROR_CHUNK_WRITE) {
              Toast.show({
                type: "error",
                text1: "Update Error",
                text2: `Something went wrong while writing the firmware to the module. Please try again. (${ErrorTypes.ota_chunk_write})`,
                visibilityTime: 10000,
              });
              OTA.cancelUpdate();
            }


            if (statusValue === UpdatingStatus.SUCCESS) {

              Toast.show({
                type: "success",
                text1: "Update Success",
                text2: `The module was updated successfully and will now restart to apply the firmware.`,
                visibilityTime: 10000,
              });

              OTA.updateVersion();
              setFirmwareVersion(OTA.latestVersion);
            }
          }
        } catch (error) {
          console.error("Error decoding UPDATE_STATUS value:", error);
        }
      },
    );

    return subscription.remove;
  }, []);

  const writeInitialSettings = useCallback(async (device: Device) => {
    const safeWriteSetting = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (error) {
        console.warn(`[BLE] Failed to sync ${label}:`, error);
      }
    };

    const runSync = async () => {
      // Write swap status (Outside orientation is enabled = 1, cabin is disabled = 0)
      const swapOrientation =
        HeadlightOrientationStore.getStatus() === ORIENTATION.OUTSIDE ? 1 : 0;
      setLeftRightSwapped(swapOrientation === 1);
      await safeWriteSetting("ORIENTATION", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.ORIENTATION, swapOrientation]),
        );
      });

      // Write sleepy eye settings
      const leftSleepy = Math.max(1, Math.min(99, Math.round(SleepyEyeStore.get("left"))));
      const rightSleepy = Math.max(1, Math.min(99, Math.round(SleepyEyeStore.get("right"))));
      setLeftSleepyEye(leftSleepy);
      setRightSleepyEye(rightSleepy);
      await safeWriteSetting("SLEEPY_EYE", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.SLEEPY_EYE, leftSleepy, rightSleepy]),
        );
      });

      // Write wave delay multiplier
      const waveDelay = CustomWaveStore.getMultiplier();
      const waveDelayInt = Math.max(0, Math.min(100, Math.round(waveDelay * 100)));
      setWaveDelayMulti(waveDelay);
      await safeWriteSetting("WAVE_DELAY", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.WAVE_DELAY, waveDelayInt]),
        );
      });

      // Write headlight bypass status
      const headlightBypass = CustomOEMButtonStore.isBypassEnabled();
      setHeadlightBypass(headlightBypass);
      await safeWriteSetting("HEADLIGHT_BYPASS", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.HEADLIGHT_BYPASS, headlightBypass ? 1 : 0]),
        );
      });

      // Write custom OEM button sequence settings: write active bindings in ascending order,
      // then delete unused higher slots in descending order (7 -> 0) so MCU shift-on-delete
      // never shifts active bindings into lower slots.
      const sequences = CustomOEMButtonStore.getAll().sort((a, b) => a.presses - b.presses);
      for (let i = 0; i < sequences.length && i < 8; i++) {
        const seq = sequences[i];
        const pos = seq.presses - 1;
        if (pos < 0 || pos >= 8) continue;
        await safeWriteSetting(`CUSTOM_BUTTON[${pos}]`, async () => {
          const bindingTarget = seq.behaviorHumanReadable
            ? seq.behaviorHumanReadable
            : seq.customCommand!;
          const payload = [pos, ...encodeButtonBinding(bindingTarget, seq.looping)];
          await device.writeCharacteristicWithResponseForService(
            ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
            bytesToBase64(payload),
          );
        });
      }
      for (let pos = 7; pos >= 0; pos--) {
        const hasSeq = sequences.some((s) => s.presses === pos + 1);
        if (!hasSeq) {
          await safeWriteSetting(`CUSTOM_BUTTON_DEL[${pos}]`, async () => {
            await device.writeCharacteristicWithResponseForService(
              ...getBLEDescriptors("SETTINGS", "CUSTOM_BUTTON"),
              bytesToBase64([pos, BINDING_DELETE_FLAG]),
            );
          });
        }
      }

      // Write stored delay value
      const delay = Math.max(100, Math.min(1000, Math.round(CustomOEMButtonStore.getDelay())));
      setButtonDelay(delay);
      await safeWriteSetting("CUSTOM_BUTTON_DELAY", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.CUSTOM_BUTTON_DELAY, delay & 0xff, (delay >> 8) & 0xff]),
        );
      });

      // Write custom OEM button enabled status
      const customEnabled = CustomOEMButtonStore.isEnabled();
      setOemCustomButtonEnabled(customEnabled);
      await safeWriteSetting("CUSTOM_BUTTON_STATUS", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.CUSTOM_BUTTON_STATUS, customEnabled ? 1 : 0]),
        );
      });

      // Write AUX buttons enabled status
      const auxEnabled = AuxButtonStore.getStatus();
      setAuxiliaryButtonsEnabled(auxEnabled);
      await safeWriteSetting("AUX_STATUS", async () => {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.AUX_STATUS, auxEnabled ? 1 : 0]),
        );
      });

      // Write AUX actions
      const aux1 = AuxButtonStore.getAuxButtonAction(AUX_ID.AUX1);
      const aux2 = AuxButtonStore.getAuxButtonAction(AUX_ID.AUX2);
      const loop1 = AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX1);
      const loop2 = AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX2);
      const type1 = AuxButtonStore.getAuxButtonType(AUX_ID.AUX1);
      const type2 = AuxButtonStore.getAuxButtonType(AUX_ID.AUX2);
      setAux1Action(aux1);
      setAux2Action(aux2);
      setAux1Loop(loop1);
      setAux2Loop(loop2);
      setAux1Type(type1);
      setAux2Type(type2);

      await safeWriteSetting("AUX_BUTTONS[0]", async () => {
        const aux1Payload = aux1 === "Default Behavior"
          ? [0, BINDING_DELETE_FLAG]
          : [0, type1 === AUX_SWITCH_TYPE.LATCHING ? 0 : 1, ...encodeButtonBinding(aux1, loop1)];
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "AUX_BUTTONS"),
          bytesToBase64(aux1Payload),
        );
      });

      await safeWriteSetting("AUX_BUTTONS[1]", async () => {
        const aux2Payload = aux2 === "Default Behavior"
          ? [1, BINDING_DELETE_FLAG]
          : [1, type2 === AUX_SWITCH_TYPE.LATCHING ? 0 : 1, ...encodeButtonBinding(aux2, loop2)];
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "AUX_BUTTONS"),
          bytesToBase64(aux2Payload),
        );
      });
    };

    const next = settingsSyncChainRef.current.then(runSync, runSync);
    settingsSyncChainRef.current = next;
    return next;
  }, []);

  // Monitor PASSKEY_UUID characteristic (connection status)
  const monitorPasskey = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("SETTINGS", "AUTH"),
      (err, char) => {
        if (err) {
          console.error("Error monitoring PASSKEY_UUID characteristic:", err);
          return;
        }
        if (!char?.value) return;

        try {
          const passkeyUpdate = base64.decode(char.value);
          if (passkeyUpdate.length === 0) return;

          const storedMac = DeviceMACStore.getStoredMAC();
          if (!storedMac && getDevicePasskey() !== "Not Paired") {
            console.warn(
              "[BLE] Connected to unpaired module while waiting for paired module match; disconnecting.",
            );
            device.cancelConnection().catch(() => {});
            return;
          }

          DeviceUUIDStore.set(passkeyUpdate);
          DeviceMACStore.setMAC(device.id);
          device
            .writeCharacteristicWithResponseForService(
              ...getBLEDescriptors("SETTINGS", "AUTH"),
              char.value,
            )
            .then(async () => {
              try {
                await writeInitialSettings(device);
              } catch (error) {
                console.warn(
                  "[BLE] Non-critical write failed during initial settings:",
                  error,
                );
              }
            })
            .catch((error) => {
              console.error("Error echoing passkey to PASSKEY_UUID:", error);
            });
        } catch (error) {
          console.error("Error decoding PASSKEY_UUID value:", error);
        }
      },
    );

    return subscription.remove;
  }, [writeInitialSettings]);

  // Monitor DEBUG characteristic (live debug log chunks)
  const monitorDebug = useCallback((device: Device) => {
    const subscription = device.monitorCharacteristicForService(
      ...getBLEDescriptors("SETTINGS", "DEBUG"),
      (err, char) => {
        if (err) {
          console.error("Error monitoring DEBUG characteristic:", err);
          return;
        }
        if (!char?.value) return;

        try {
          const decodedChunk = base64.decode(char.value);
          if (!decodedChunk) return;

          const combined = debugLineBufferRef.current + decodedChunk;
          const lines = combined.split("\n");
          debugLineBufferRef.current = lines.pop() ?? "";

          if (lines.length === 0) return;

          const now = new Date();
          const timestamp =
            String(now.getMinutes()).padStart(2, "0") +
            ":" +
            String(now.getSeconds()).padStart(2, "0");

          const newEntries: DebugLogEntry[] = [];
          for (const rawLine of lines) {
            const trimmed = rawLine.replace(/\r$/, "");
            if (!trimmed) continue;

            const match = trimmed.match(/^\[([EWIDV?])\]\[([^\]]+)\]\s*(.*)$/);
            const levelChar = (match?.[1] as DebugLogEntry["levelChar"]) ?? "?";
            const tag = match?.[2] ?? "LOG";
            const message = match?.[3] ?? trimmed;

            let level = DebugLevel.INFO;
            if (levelChar === "E") level = DebugLevel.ERROR;
            else if (levelChar === "W") level = DebugLevel.WARN;
            else if (levelChar === "I") level = DebugLevel.INFO;
            else if (levelChar === "D") level = DebugLevel.DEBUG;
            else if (levelChar === "V") level = DebugLevel.VERBOSE;

            debugLogIdRef.current += 1;
            newEntries.push({
              id: debugLogIdRef.current,
              timestamp,
              level,
              levelChar,
              tag,
              message,
              raw: trimmed,
            });
          }

          if (newEntries.length > 0) {
            pendingDebugLogsRef.current.push(...newEntries);
            if (!debugFlushTimerRef.current) {
              debugFlushTimerRef.current = setTimeout(flushPendingDebugLogs, 100);
            }
          }
        } catch (error) {
          console.error("Error decoding DEBUG value:", error);
        }
      },
    );

    return subscription.remove;
  }, [flushPendingDebugLogs]);

  // Monitor GENERAL_SETTINGS characteristic (MCU-initiated settings/reset notifications)
  const monitorGeneralSettings = useCallback(
    (device: Device, onReset: () => Promise<void>) => {
      const subscription = device.monitorCharacteristicForService(
        ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
        (err, char) => {
          if (err) {
            console.error(
              "Error monitoring GENERAL_SETTINGS characteristic:",
              err,
            );
            return;
          }
          if (!char?.value) return;

          try {
            const bytes = base64ToBytes(char.value);
            if (bytes.length === 0) return;

            const flag = bytes[0];
            if (flag === SettingFlag.ORIENTATION && bytes.length >= 2) {
              const swapped = bytes[1] === 1;
              if (swapped) {
                HeadlightOrientationStore.enable();
              } else {
                HeadlightOrientationStore.disable();
              }
              setLeftRightSwapped(swapped);
            } else if (flag === SettingFlag.RESET) {
              onReset();
            }
          } catch (error) {
            console.error("Error decoding GENERAL_SETTINGS value:", error);
          }
        },
      );

      return subscription.remove;
    },
    [],
  );

  // Start monitoring all characteristics
  const startMonitoring = useCallback(
    async (
      device: Device,
      onCustomCommandInterrupt: () => void,
      onReset: () => Promise<void>,
    ) => {
      try {
        subscriptionsRef.current.forEach((unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.error("Error unsubscribing from previous monitor:", error);
          }
        });
        subscriptionsRef.current = [
          monitorHeadlightStatus(device),
          monitorGeneralSettings(device, onReset),
          monitorPasskey(device),
          monitorDebug(device),
          monitorUpdateProgress(device),
          monitorUpdateStatus(device),
        ];
      } catch (error) {
        console.error("Error setting up monitors:", error);
        stopMonitoring();
      }
    },
    [
      monitorHeadlightStatus,
      monitorGeneralSettings,
      monitorUpdateProgress,
      monitorUpdateStatus,
      monitorPasskey,
      monitorDebug,
    ],
  );

  // Stop all monitoring
  const stopMonitoring = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from monitor:", error);
      }
    });
    subscriptionsRef.current = [];
    if (debugFlushTimerRef.current) {
      clearTimeout(debugFlushTimerRef.current);
      debugFlushTimerRef.current = null;
    }
    flushPendingDebugLogs();
    debugLineBufferRef.current = "";
    setDebugLevel(DebugLevel.NONE);
    setUpdatingStatus(UpdatingStatus.IDLE);
    setUpdateProgress(0);
    // setIsConnected(false);
  }, [flushPendingDebugLogs]);

  // Read initial values from characteristics
  const readInitialValues = useCallback(
    async (device: Device) => {
      // Read HEADLIGHT_STATUS
      try {
        const initStatus = await device.readCharacteristicForService(
          ...getBLEDescriptors("WINK", "HEADLIGHT_STATUS"),
        );
        if (initStatus?.value) {
          parseAndSetHeadlightStatus(initStatus.value);
        }
      } catch (error) {
        console.warn("[BLE] Non-critical read failed for HEADLIGHT_STATUS:", error);
      }

      // Read FIRMWARE_VERSION (3-byte [major, minor, patch])
      try {
        const firmware = await device.readCharacteristicForService(
          ...getBLEDescriptors("OTA", "FIRMWARE_VERSION"),
        );
        if (firmware?.value) {
          const bytes = base64ToBytes(firmware.value);
          if (bytes.length >= 3) {
            const version = `${bytes[0]}.${bytes[1]}.${bytes[2]}`;
            updateFirmwareVersion(version);
          }
        }
      } catch (error) {
        console.warn(
          "[BLE] Non-critical read failed for FIRMWARE_VERSION:",
          error,
        );
      }

      // Read SOFTWARE_STATUS (1-byte uint8 UpdatingStatus)
      try {
        const status = await device.readCharacteristicForService(
          ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
        );
        if (status?.value) {
          const bytes = base64ToBytes(status.value);
          if (bytes.length >= 1) {
            setUpdatingStatus(bytes[0] as UpdatingStatus);
            setUpdateProgress(0);
          }
        }
      } catch (error) {
        console.warn(
          "[BLE] Non-critical read failed for SOFTWARE_STATUS:",
          error,
        );
      }
    },
    [parseAndSetHeadlightStatus, updateFirmwareVersion],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const isSleepyEyeActive =
    (leftStatus !== 0 && leftStatus !== 1) ||
    (rightStatus !== 0 && rightStatus !== 1);

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
    auxiliaryButtonsEnabled,
    aux1Action,
    aux2Action,
    aux1Loop,
    aux2Loop,
    aux1Type,
    aux2Type,
    setButtonDelay,
    setHeadlightBypass,
    setOemCustomButtonEnabled,
    setAuxiliaryButtonsEnabled,
    setAux1Action,
    setAux2Action,
    setAux1Loop,
    setAux2Loop,
    setAux1Type,
    setAux2Type,
    setWaveDelayMulti,
    setLeftRightSwapped,
    setLeftSleepyEye,
    setRightSleepyEye,
    setFirmwareVersion,
    debugLevel,
    debugLogs,
    setDebugLevel,
    clearDebugLogs,

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
