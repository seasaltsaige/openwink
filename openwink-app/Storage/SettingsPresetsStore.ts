import Storage from "./Storage";
import { ColorTheme } from "../helper/Constants";
import { QuickLink } from "../Components";
import { CommandOutput, ButtonBehaviors, Presses, CustomButtonAction } from "../helper/Types";
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
  AUX_SWITCH_TYPE,
  AuxButtonStore,
  AUX_ID,
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
  customOEMButtons: CustomButtonAction[];
  customOEMButtonDelay: number;

  auxBtnConfig: {
    enabled: boolean;
    one: {
      action: ButtonBehaviors | CommandOutput;
      type: AUX_SWITCH_TYPE;
      loop: boolean;
    };
    two: {
      action: ButtonBehaviors | CommandOutput;
      type: AUX_SWITCH_TYPE;
      loop: boolean;
    }
  }

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

    for (let i = 1; i <= 9; i++) {
      const pressPreset = preset.customOEMButtons.find(v => v.presses === i);
      if (!pressPreset) CustomOEMButtonStore.remove(i as Presses);
      else CustomOEMButtonStore.set(pressPreset.presses, pressPreset.behaviorHumanReadable ? pressPreset.behaviorHumanReadable : pressPreset.customCommand!);
    }

    CustomOEMButtonStore.setDelay(preset.customOEMButtonDelay);

    if (type === ApplyType.AS_NEW_DEVICE && preset.deviceUUID !== null) {
      DeviceUUIDStore.set(preset.deviceUUID);
      console.log("Updated Device UUID to " + DeviceUUIDStore.get());

      if (preset.deviceMAC)
        DeviceMACStore.setMAC(preset.deviceMAC);

      if (preset.firmwareVersion)
        FirmwareStore.setFirmwareVersion(preset.firmwareVersion);
    }


    if (preset.auxBtnConfig.enabled)
      AuxButtonStore.enable();
    else
      AuxButtonStore.disable();
    AuxButtonStore.setAuxButtonAction(AUX_ID.AUX1, preset.auxBtnConfig.one.action);
    AuxButtonStore.setAuxButtonAction(AUX_ID.AUX2, preset.auxBtnConfig.two.action);
    AuxButtonStore.setAuxButtonLoop(AUX_ID.AUX1, preset.auxBtnConfig.one.loop);
    AuxButtonStore.setAuxButtonLoop(AUX_ID.AUX2, preset.auxBtnConfig.two.loop);
    AuxButtonStore.setAuxButtonType(AUX_ID.AUX1, preset.auxBtnConfig.one.type);
    AuxButtonStore.setAuxButtonType(AUX_ID.AUX2, preset.auxBtnConfig.two.type);

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


      auxBtnConfig: {
        enabled: AuxButtonStore.getStatus(),
        one: {
          action: AuxButtonStore.getAuxButtonAction(AUX_ID.AUX1),
          loop: AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX1),
          type: AuxButtonStore.getAuxButtonType(AUX_ID.AUX1),
        },
        two: {
          action: AuxButtonStore.getAuxButtonAction(AUX_ID.AUX2),
          loop: AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX2),
          type: AuxButtonStore.getAuxButtonType(AUX_ID.AUX2),
        }
      },
    }

    Storage.set(`${SETTINGS_PRESETS_KEY}-${name}`, JSON.stringify(preset));
    return preset;
  }

  static createFromData(presetData: Partial<SettingsPreset>) {
    const exists = this.getPreset(presetData.name!)

    const preset: SettingsPreset = {
      name: presetData.name!,
      createdAt: exists !== null ? exists.createdAt : Date.now(),
      updatedAt: Date.now(),
      autoConnect: presetData.autoConnect ?? AutoConnectStore.get(),
      colorTheme: presetData.colorTheme ?? ThemeStore.getStoredTheme(),
      headlightOrientation: presetData.headlightOrientation ?? HeadlightOrientationStore.getStatus(),
      headlightMovementSpeed: {
        left: presetData.headlightMovementSpeed?.left ?? HeadlightMovementSpeedStore.getMotionValue(SIDE.LEFT),
        right: presetData.headlightMovementSpeed?.right ?? HeadlightMovementSpeedStore.getMotionValue(SIDE.RIGHT),
      },
      customWaveMultiplier: presetData.customWaveMultiplier ?? CustomWaveStore.getMultiplier(),
      sleepyEye: {
        left: presetData.sleepyEye?.left ?? SleepyEyeStore.get("left"),
        right: presetData.sleepyEye?.right ?? SleepyEyeStore.get("right"),
      },
      quickLinks: presetData.quickLinks ?? QuickLinksStore.getLinks(),
      customCommands: presetData.customCommands ?? CustomCommandStore.getAll(),
      customOEMButtonEnabled: presetData.customOEMButtonEnabled ?? CustomOEMButtonStore.isEnabled(),
      customOEMBypassEnabled: presetData.customOEMBypassEnabled ?? CustomOEMButtonStore.isBypassEnabled(),
      customOEMButtons: presetData.customOEMButtons ?? CustomOEMButtonStore.getAll(),
      customOEMButtonDelay: presetData.customOEMButtonDelay ?? CustomOEMButtonStore.getDelay(),
      deviceUUID: (presetData.deviceUUID && presetData.deviceUUID !== "Not Paired") ? presetData.deviceUUID : null,

      deviceMAC: presetData.deviceMAC ?? DeviceMACStore.getStoredMAC(),
      firmwareVersion: presetData.firmwareVersion ?? FirmwareStore.getFirmwareVersion(),


      auxBtnConfig: {
        enabled: presetData.auxBtnConfig?.enabled ?? AuxButtonStore.getStatus(),
        one: {
          action: presetData.auxBtnConfig?.one.action ?? AuxButtonStore.getAuxButtonAction(AUX_ID.AUX1),
          loop: presetData.auxBtnConfig?.one.loop ?? AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX1),
          type: presetData.auxBtnConfig?.one.type ?? AuxButtonStore.getAuxButtonType(AUX_ID.AUX1),
        },
        two: {
          action: presetData.auxBtnConfig?.two.action ?? AuxButtonStore.getAuxButtonAction(AUX_ID.AUX2),
          loop: presetData.auxBtnConfig?.two.loop ?? AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX2),
          type: presetData.auxBtnConfig?.two.type ?? AuxButtonStore.getAuxButtonType(AUX_ID.AUX2),
        }
      },
    }

    Storage.set(`${SETTINGS_PRESETS_KEY}-${preset.name}`, JSON.stringify(preset));
    return preset;
  }


}
