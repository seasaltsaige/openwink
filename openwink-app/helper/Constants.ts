import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";

export const BLE = {
  SERVICES: {
    WINK: {
      UUID: "a144c6b0-5e1a-4460-bb92-3674b2f51520",
      CHARS: {
        DEFAULT_COMMAND: "034a383c-d3e4-4501-b7a5-1c950db4f3c7",
        HEADLIGHT_STATUS: "8d2b7b9f-c6a3-4f56-9f4f-2dc7d7873c18",
        CUSTOM_COMMAND: "1313c33f-e793-422c-8c04-c82be9fe8a02",
      },
    },
    OTA: {
      UUID: "e24c13d7-d7c7-4301-903a-7750b09fc935",
      CHARS: {
        OTA_COMMAND: "58f93211-63c5-4b0b-b4e6-544c559417d7",
        FIRMWARE_VERSION: "37187af3-defd-46df-a8de-881c0b20d8b3",
        SOFTWARE_UPDATING: "a0ee1ea6-2b18-4ae6-aa87-0238dde7d760",
        SOFTWARE_STATUS: "2d393ed3-ed78-4d57-900a-d3e46296f92d",
      },
    },
    SETTINGS: {
      UUID: "cb5f7a1f-59f2-418e-b9d1-d6fc5c85a749",
      CHARS: {
        CUSTOM_BUTTON: "795a9433-cf23-4550-80b5-70a0c9413cac",
        GENERAL_SETTINGS: "bf133860-e47e-43e3-b1ed-cd87a1d9cb63",
        AUTH: "f61146f2-791d-4ef7-95aa-b565097f69c2",
        AUX_BUTTONS: "bf3d4b2c-0620-4b34-9474-37aa6cef28b9",
        DEBUG: "5015946c-7bfb-4b78-b748-2eeb96712164",
      },
    },
  },
} as const;

type BLEType = typeof BLE;

export function getBLEDescriptors<
  S extends keyof BLEType["SERVICES"],
  C extends keyof BLEType["SERVICES"][S]["CHARS"]
>(
  service: S,
  char: C
): readonly [BLEType["SERVICES"][S]["UUID"], BLEType["SERVICES"][S]["CHARS"][C]] {
  const serviceUUID = BLE.SERVICES[service].UUID;
  const chars = BLE.SERVICES[service].CHARS as typeof BLE.SERVICES[S]["CHARS"];
  return [serviceUUID, chars[char]] as const;
}

export const SCAN_TIME_SECONDS = 30 * 1000;

export const DELAY_PREFIX = 0xDE;
export const CANCEL_COMMAND_PAYLOAD = 0xCA;
export const BINDING_DELETE_FLAG = 0xDD;
export const MAX_CUSTOM_CMD_SEQUENCE_LENGTH = 60;
export const MAX_CUSTOM_CMD_DELAY_MS = 65535;

export enum BindingType {
  NONE = 0,
  BUILTIN = 1,
  CUSTOM_SEQUENCE = 2,
  SETTING = 3,
}

export enum SettingFlag {
  CUSTOM_BUTTON_STATUS = 0xBE,
  CUSTOM_BUTTON_DELAY = 0xAA,
  AUX_STATUS = 0xBB,
  WAVE_DELAY = 0xEE,
  SLEEPY_EYE = 0x99,
  HEADLIGHT_BYPASS = 0x88,
  ORIENTATION = 0xCC,
  LONG_TERM_SLEEP = 0x77,
  UNPAIR = 0x66,
  RESET = 0xFF,
}

export enum OTAControlCommand {
  START = 0x01,
  DONE = 0x02,
  HALT = 0x03,
}

export const ATT_HEADER_SIZE = 3;
export const OTA_ACK_WINDOW_SIZE = 20;

export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5,
}

export const DebugLevelLabels: Record<DebugLevel, string> = {
  [DebugLevel.NONE]: "Off",
  [DebugLevel.ERROR]: "Error",
  [DebugLevel.WARN]: "Warn",
  [DebugLevel.INFO]: "Info",
  [DebugLevel.DEBUG]: "Debug",
  [DebugLevel.VERBOSE]: "Verbose",
};

// If you are a user working on your own build of the app
// you can set EXPO_PUBLIC_UPDATE_URL in .env.local or update the local IP below.
// use ipconfig or ifconfig to view your local IP addr.
export const UPDATE_SERVER_BASE =
  process.env.EXPO_PUBLIC_UPDATE_SERVER_BASE ??
  "https://update-server.netlify.app";

export const UPDATE_URL =
  process.env.EXPO_PUBLIC_UPDATE_URL ??
  (__DEV__ && !process.env.EXPO_PUBLIC_UPDATE_SERVER_BASE
    ? "http://172.20.9.16:3000/.netlify/functions/api/update"
    : `${UPDATE_SERVER_BASE}/.netlify/functions/api/update`);

export const OTA_API_KEY =
  process.env.EXPO_PUBLIC_OTA_API_KEY ??
  "Cb8VHA})liX~azNU&+;KV{22:`16'S{@g;d<$Cu@H0`0k/Qh>]";
export const jkYSbsSAIDns = OTA_API_KEY;

export enum ButtonStatus {
  DOWN = 0,
  UP = 1,
}

export enum DefaultCommandValue {
  BOTH_UP = 1,
  BOTH_DOWN,
  BOTH_BLINK,
  BOTH_BLINK_X2,
  LEFT_UP,
  LEFT_DOWN,
  LEFT_WINK,
  LEFT_WINK_X2,
  RIGHT_UP,
  RIGHT_DOWN,
  RIGHT_WINK,
  RIGHT_WINK_X2,
  LEFT_WAVE,
  RIGHT_WAVE,
  LEFT_RIGHT,
  LEFT_RIGHT_X2,
  RIGHT_LEFT,
  RIGHT_LEFT_X2,
  SLEEPY_EYE,
}

export const DefaultCommandValueEnglish = [
  "Both Up", "Both Down", "Both Blink", "Both Blink x2",
  "Left Up", "Left Down", "Left Wink", "Left Wink x2",
  "Right Up", "Right Down", "Right Wink", "Right Wink x2",
  "Left Wave", "Right Wave",
  "Left-Right", "Left-Right x2", "Right-Left", "Right-Left x2",
  "Sleepy Eye",
] as const;

export const DEFAULT_COMMAND_DATA = [
  [
    {
      name: "Left Up",
      value: DefaultCommandValue.LEFT_UP,
    },
    {
      name: "Left Down",
      value: DefaultCommandValue.LEFT_DOWN,
    },

  ],
  [
    {
      name: "Both Up",
      value: DefaultCommandValue.BOTH_UP,
    },
    {
      name: "Both Down",
      value: DefaultCommandValue.BOTH_DOWN,
    },

  ],
  [
    {
      name: "Right Up",
      value: DefaultCommandValue.RIGHT_UP,
    },
    {
      name: "Right Down",
      value: DefaultCommandValue.RIGHT_DOWN,
    },

  ]
];

export const DEFAULT_WINK_DATA = [{
  name: "Left Wink",
  value: DefaultCommandValue.LEFT_WINK,
},
{
  name: "Both Blink",
  value: DefaultCommandValue.BOTH_BLINK,
},
{
  name: "Right Wink",
  value: DefaultCommandValue.RIGHT_WINK,
}];

export const MACRO_DATA = [
  [{ name: "Left Wave", command: DefaultCommandValue.LEFT_WAVE }, { name: "Left-Right", command: DefaultCommandValue.LEFT_RIGHT }, { name: "Left-Right x2", command: DefaultCommandValue.LEFT_RIGHT_X2 }],
  [{ name: "Right Wave", command: DefaultCommandValue.RIGHT_WAVE }, { name: "Right-Left", command: DefaultCommandValue.RIGHT_LEFT }, { name: "Right-Left x2", command: DefaultCommandValue.RIGHT_LEFT_X2 }],
];

export const SETTINGS_DATA: Array<{
  pageName: string;
  pageSymbol: keyof typeof IonIcons.glyphMap | null;
  navigationName: string;
}> = [
    {
      pageName: "System Information",
      navigationName: "Info",
      pageSymbol: "information-circle-outline"
    },
    {
      pageName: "Module Settings",
      navigationName: "ModuleSettings",
      pageSymbol: "build-outline"
    },
    {
      pageName: "Application Theme",
      navigationName: "Theme",
      pageSymbol: "color-fill-outline"
    },
    {
      pageName: "System Profiles",
      navigationName: "SettingsProfiles",
      pageSymbol: "settings-outline"
    },
    {
      pageName: "System Terms of Use",
      navigationName: "TermsOfUse",
      pageSymbol: "document-text-outline",
    },
  ]

export enum BehaviorEnum {
  DEFAULT = 0,
  BOTH_BLINK = DefaultCommandValue.BOTH_BLINK,
  BOTH_BLINK_X2 = DefaultCommandValue.BOTH_BLINK_X2,
  LEFT_WINK = DefaultCommandValue.LEFT_WINK,
  LEFT_WINK_X2 = DefaultCommandValue.LEFT_WINK_X2,
  RIGHT_WINK = DefaultCommandValue.RIGHT_WINK,
  RIGHT_WINK_X2 = DefaultCommandValue.RIGHT_WINK_X2,
  LEFT_WAVE = DefaultCommandValue.LEFT_WAVE,
  RIGHT_WAVE = DefaultCommandValue.RIGHT_WAVE,
  LEFT_RIGHT = DefaultCommandValue.LEFT_RIGHT,
  LEFT_RIGHT_X2 = DefaultCommandValue.LEFT_RIGHT_X2,
  RIGHT_LEFT = DefaultCommandValue.RIGHT_LEFT,
  RIGHT_LEFT_X2 = DefaultCommandValue.RIGHT_LEFT_X2,
  SLEEPY_EYE = DefaultCommandValue.SLEEPY_EYE,
}

// Maps english to actual value
export const buttonBehaviorMap = {
  "Default Behavior": BehaviorEnum.DEFAULT,
  "Left Wink": BehaviorEnum.LEFT_WINK,
  "Left Wink x2": BehaviorEnum.LEFT_WINK_X2,
  "Left-Right": BehaviorEnum.LEFT_RIGHT,
  "Left-Right x2": BehaviorEnum.LEFT_RIGHT_X2,
  "Right Wink": BehaviorEnum.RIGHT_WINK,
  "Right Wink x2": BehaviorEnum.RIGHT_WINK_X2,
  "Right-Left": BehaviorEnum.RIGHT_LEFT,
  "Right-Left x2": BehaviorEnum.RIGHT_LEFT_X2,
  "Both Blink": BehaviorEnum.BOTH_BLINK,
  "Both Blink x2": BehaviorEnum.BOTH_BLINK_X2,
  "Left Wave": BehaviorEnum.LEFT_WAVE,
  "Right Wave": BehaviorEnum.RIGHT_WAVE,
  "Sleepy Eye": BehaviorEnum.SLEEPY_EYE,
} as const;

export const buttonBehaviorMapReversed = {
  [BehaviorEnum.DEFAULT]: "Default Behavior",
  [BehaviorEnum.LEFT_WINK]: "Left Wink",
  [BehaviorEnum.LEFT_WINK_X2]: "Left Wink x2",
  [BehaviorEnum.LEFT_RIGHT]: "Left-Right",
  [BehaviorEnum.LEFT_RIGHT_X2]: "Left-Right x2",
  [BehaviorEnum.RIGHT_WINK]: "Right Wink",
  [BehaviorEnum.RIGHT_WINK_X2]: "Right Wink x2",
  [BehaviorEnum.RIGHT_LEFT]: "Right-Left",
  [BehaviorEnum.RIGHT_LEFT_X2]: "Right-Left x2",
  [BehaviorEnum.BOTH_BLINK]: "Both Blink",
  [BehaviorEnum.BOTH_BLINK_X2]: "Both Blink x2",
  [BehaviorEnum.LEFT_WAVE]: "Left Wave",
  [BehaviorEnum.RIGHT_WAVE]: "Right Wave",
  [BehaviorEnum.SLEEPY_EYE]: "Sleepy Eye",
} as const;

export const countToEnglish = ["Single Press", "Double Press", "Triple Press", "Quadruple Press", "Quintuple Press", "Sextuple Press", "Septuple Press", "Octuple Press", "Nonuple Press"];

type HexNumber = `#${string}`;

export interface ThemeColors {
  primary: HexNumber;
  backgroundPrimaryColor: HexNumber;
  backgroundSecondaryColor: HexNumber;
  debugViewColor: HexNumber;
  dropdownColor: HexNumber;
  buttonColor: HexNumber;
  disabledButtonColor: HexNumber;
  buttonTextColor: HexNumber;
  disabledButtonTextColor: HexNumber;
  headerTextColor: HexNumber;
  bottomTabsBackground: HexNumber;
  bottomTabsTextColor: HexNumber;
  bottomTabsPill: HexNumber;
  textColor: HexNumber;
  warning: HexNumber;
}

export namespace ColorTheme {

  export const themeKeys = [
    "crystalWhite",
    "brilliantBlack",
    "classicRed",
    "sunburstYellow",
    "marinerBlue",
    "britishRacingGreen",
  ] as const;

  export type ThemeKey = typeof themeKeys[number];

  export const themeNames: Record<ThemeKey, string> = {
    crystalWhite: "Crystal White",
    brilliantBlack: "Brilliant Black",
    classicRed: "Classic Red",
    sunburstYellow: "Sunburst Yellow",
    marinerBlue: "Mariner Blue",
    britishRacingGreen: "British Racing Green",
  };


  export const crystalWhite: ThemeColors = {
    primary: "#ffffff",
    backgroundPrimaryColor: "#f1f1f1",
    backgroundSecondaryColor: "#ffffff",
    debugViewColor: "#e4e4e7",
    bottomTabsBackground: "#ffffff",
    bottomTabsTextColor: "#141414",
    bottomTabsPill: "#f5ebdf",
    dropdownColor: "#e8e8e8",
    buttonColor: "#bd9664",
    disabledButtonColor: "#dbdbdb",
    buttonTextColor: "#000000",
    disabledButtonTextColor: "#000000",
    headerTextColor: "#000000",
    textColor: "#141414",
    warning: "#D0342C"
  }

  export const brilliantBlack: ThemeColors = {
    primary: "#550000",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#262629",
    debugViewColor: "#0c0c0e",
    bottomTabsBackground: "#1c1c1c",
    bottomTabsTextColor: "#ffffff",
    bottomTabsPill: "#efe6e6",
    dropdownColor: "#2F2F32",
    buttonColor: "#550000", // Burgundy (default)
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
    warning: "#D0342C"
  }

  export const classicRed: ThemeColors = {
    primary: "#c8102e",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#262629",
    debugViewColor: "#0c0c0e",
    bottomTabsBackground: "#1c1c1c",
    bottomTabsTextColor: "#ffffff",
    bottomTabsPill: "#efe6e6",
    dropdownColor: "#2F2F32",
    buttonColor: "#c8102e", // Classic Red
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
    warning: "#D0342C"
  }

  // TODO: Needs work on pill color
  export const sunburstYellow: ThemeColors = {
    primary: "#ffcc00",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#262629",
    debugViewColor: "#0c0c0e",
    bottomTabsBackground: "#1c1c1c",
    bottomTabsTextColor: "#ffffff",
    bottomTabsPill: "#b0b0b069",
    dropdownColor: "#2F2F32",
    buttonColor: "#ffcc00", // Sunburst Yellow
    disabledButtonColor: "#878787",
    buttonTextColor: "#141414",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
    warning: "#D0342C"
  }

  export const marinerBlue: ThemeColors = {
    primary: "#0033a0",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#262629",
    debugViewColor: "#0c0c0e",
    bottomTabsBackground: "#1c1c1c",
    bottomTabsTextColor: "#ffffff",
    bottomTabsPill: "#efe6e6",
    dropdownColor: "#2F2F32",
    buttonColor: "#0033a0", // Marina Blue
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
    warning: "#D0342C"
  }

  export const britishRacingGreen: ThemeColors = {
    primary: "#004d26",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#262629",
    debugViewColor: "#0c0c0e",
    bottomTabsBackground: "#1c1c1c",
    bottomTabsTextColor: "#ffffff",
    bottomTabsPill: "#efe6e6",
    dropdownColor: "#2F2F32",
    buttonColor: "#004d26", // British Racing Green
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
    warning: "#D0342C"
  }
}

// TODO: Update to be adaptive with screen width
// no
const SVG_WIDTH = 300;
const SCALE_BY = 411.42857142857144; // wtf is this lol

export const useSvgWidth = () => {
  const [svgWidth, setSvgWidth] = useState(0);
  useEffect(() => {
    setSvgWidth(SVG_WIDTH * (Dimensions.get("window").width / SCALE_BY));
  }, []);
  return svgWidth;
}
