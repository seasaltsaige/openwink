import Storage from "./Storage";
import { ColorTheme } from "../helper/Constants";
import { QuickLink } from "../Components";
import { CommandOutput, ButtonBehaviors, Presses } from "../helper/Types";
import {
  AutoConnectStore,
  CustomCommandStore,
  CustomOEMButtonStore,
  CustomWaveStore,
  DeviceMACStore,
  FirmwareStore,
  SleepyEyeStore,
  ThemeStore,
  QuickLinksStore,
  HeadlightOrientationStore,
  HeadlightMovementSpeedStore,
} from "./";
import { ORIENTATION } from "./HeadlightOrientationStore";
import { SIDE } from "./HeadlightMovementSpeedStore";
import { DeviceUUIDStore } from "./DeviceUUIDStore";
import { getDevicePasskey } from "../helper/Functions";

const SETTINGS_PRESETS_KEY = "settings-presets";
const PRESETS_CURRENT_KEY = "presets-name";

/**
 * @description Apply Type defines the type of application done when applying a settings preset. 
 *              Applying as a new device will assume Device pairing UUIDs differ, and as such, will update them.
 *              Applying as an old device will assume Device pairing UUIDs should remain the same, and will not update them.
 */
export enum ApplyType {
  AS_NEW_DEVICE,
  AS_OLD_DEVICE
}

export type CustomOEMButtonPresetItem = {
  numberPresses: Presses;
  behavior: ButtonBehaviors | CommandOutput;
};

export type HeadlightMovementPreset = {
  left: number;
  right: number;
};

export type SleepyEyePreset = {
  left: number;
  right: number;
};

export interface SettingsPreset {
  name: string;
  createdAt: number;
  updatedAt: number;

  autoConnect: boolean;
  colorTheme: keyof typeof ColorTheme.themeNames | null;
  headlightOrientation: ORIENTATION;
  headlightMovementSpeed: HeadlightMovementPreset;
  customWaveMultiplier: number;
  sleepyEye: SleepyEyePreset;

  quickLinks: QuickLink[];
  customCommands: CommandOutput[];
  customOEMButtonEnabled: boolean;
  customOEMBypassEnabled: boolean;
  customOEMButtons: CustomOEMButtonPresetItem[];
  customOEMButtonDelay: number;

  deviceUUID: string | null;
  deviceMAC: string | null;
  firmwareVersion: string | null;
}

export abstract class SettingsPresetsStore {
  static getAll(): SettingsPreset[] {

    const presets: SettingsPreset[] = [];
    const keys = Storage.getAllKeys().filter(key => key.startsWith(SETTINGS_PRESETS_KEY));
    for (const key of keys) {
      const pData = Storage.getString(key);
      if (!pData) continue;
      presets.push(JSON.parse(pData) as SettingsPreset);
    }

    return presets;
  }

  static getAllNames() {
    const names: string[] = [];
    const keys = Storage.getAllKeys().filter(key => key.startsWith(SETTINGS_PRESETS_KEY));
    for (const key of keys) {
      const pData = Storage.getString(key);
      if (!pData) continue;
      names.push((JSON.parse(pData) as SettingsPreset).name);
    }

    return names;
  }

  static getPreset(name: string): SettingsPreset | null {
    const key = `${SETTINGS_PRESETS_KEY}-${name}`;
    const pData = Storage.getString(key);
    if (!pData) return null;
    return JSON.parse(pData) as SettingsPreset;
  }

  static deletePreset(name: string) {
    Storage.delete(`${SETTINGS_PRESETS_KEY}-${name}`);
  }

  static applyPreset(name: string, type: ApplyType) {
    const preset = this.getPreset(name);
    if (!preset) return false;

    AutoConnectStore.set(preset.autoConnect);
    if (preset.colorTheme)
      ThemeStore.setTheme(preset.colorTheme)
    
    if (preset.headlightOrientation)
      HeadlightOrientationStore.enable();
    else
      HeadlightOrientationStore.disable();

    HeadlightMovementSpeedStore.setMotionValue(SIDE.LEFT, preset.headlightMovementSpeed.left);
    HeadlightMovementSpeedStore.setMotionValue(SIDE.RIGHT, preset.headlightMovementSpeed.right);

    CustomWaveStore.setMultiplier(preset.customWaveMultiplier);

    SleepyEyeStore.set("left", preset.sleepyEye.left);
    SleepyEyeStore.set("right", preset.sleepyEye.right);

    QuickLinksStore.setLinks(preset.quickLinks);
    
    CustomCommandStore.deleteAll();
    for (const cmd of preset.customCommands) {
      if (!cmd.command) continue;
      CustomCommandStore.saveCommand(cmd.name, cmd.command)
    }

    if (preset.customOEMButtonEnabled)
      CustomOEMButtonStore.enable();
    else 
      CustomOEMButtonStore.disable();

    if (preset.customOEMBypassEnabled)
      CustomOEMButtonStore.enableBypass();
    else
      CustomOEMButtonStore.disableBypass();

    for (let i = 2; i <= 9; i++) {
      const pressPreset = preset.customOEMButtons.find(v => v.numberPresses === i);
      if (!pressPreset) CustomOEMButtonStore.remove(i as Presses);
      else CustomOEMButtonStore.set(pressPreset.numberPresses, pressPreset.behavior);
    }

    CustomOEMButtonStore.setDelay(preset.customOEMButtonDelay);

    if (type === ApplyType.AS_NEW_DEVICE && preset.deviceUUID !== null) {
      DeviceUUIDStore.set(preset.deviceUUID);

      if (preset.deviceMAC)
        DeviceMACStore.setMAC(preset.deviceMAC);

      if (preset.firmwareVersion)
        FirmwareStore.setFirmwareVersion(preset.firmwareVersion);
    }
    return true;
  } 

  static existsByName(name: string) {
    return this.getPreset(name) !== null;
  }
  
  static saveFromCurrent(name: string) {
    const exists = this.getPreset(name);

    const deviceUUID = getDevicePasskey();

    const preset: SettingsPreset = {
      name,
      createdAt: exists !== null ? exists.createdAt : Date.now(),
      updatedAt: Date.now(),
      autoConnect: AutoConnectStore.get(),
      colorTheme: ThemeStore.getStoredTheme(),
      headlightOrientation: HeadlightOrientationStore.getStatus(),
      headlightMovementSpeed: {
        left: HeadlightMovementSpeedStore.getMotionValue(SIDE.LEFT),
        right: HeadlightMovementSpeedStore.getMotionValue(SIDE.RIGHT),
      },
      customWaveMultiplier: CustomWaveStore.getMultiplier(),
      sleepyEye: {
        left: SleepyEyeStore.get("left"),
        right: SleepyEyeStore.get("right"),
      },
      quickLinks: QuickLinksStore.getLinks(),
      customCommands: CustomCommandStore.getAll(),
      customOEMButtonEnabled: CustomOEMButtonStore.isEnabled(),
      customOEMBypassEnabled: CustomOEMButtonStore.isBypassEnabled(),
      customOEMButtons: CustomOEMButtonStore.getAll(),
      customOEMButtonDelay: CustomOEMButtonStore.getDelay(),
      deviceUUID: deviceUUID !== "Not Paired" ? deviceUUID : null,
      deviceMAC: DeviceMACStore.getStoredMAC(),
      firmwareVersion: FirmwareStore.getFirmwareVersion(),
    }

    Storage.set(`${SETTINGS_PRESETS_KEY}-${name}`, JSON.stringify(preset));
    return preset;
  }


}
