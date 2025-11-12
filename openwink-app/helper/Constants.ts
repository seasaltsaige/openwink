/** ---- BEGIN BLE UUID DEFINITIONS ---- **/
// Service for headlight movements
export const WINK_SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520";
// Service for OTA Update + OTA Status indication
export const OTA_SERVICE_UUID = "e24c13d7-d7c7-4301-903a-7750b09fc935";
// Service for Wink Module Settings
export const MODULE_SETTINGS_SERVICE_UUID = "cb5f7a1f-59f2-418e-b9d1-d6fc5c85a749";

// WINK CHARACTERISTICS //
export const HEADLIGHT_CHAR_UUID = "034a383c-d3e4-4501-b7a5-1c950db4f3c7";
export const BUSY_CHAR_UUID = "8d2b7b9f-c6a3-4f56-9f4f-2dc7d7873c18";
export const LEFT_STATUS_UUID = "c4907f4a-fb0c-440c-bbf1-4836b0636478";
export const RIGHT_STATUS_UUID = "784dd553-d837-4027-9143-280cb035163a";
export const SLEEPY_EYE_UUID = "a8237fed-e0a4-4ecd-9881-9b5dbb3f5902";
export const SYNC_UUID = "eceed349-998f-46a2-9835-4f2db7552381";
export const CUSTOM_COMMAND_UUID = "1313c33f-e793-422c-8c04-c82be9fe8a02";
// END WINK CHARACTERISTICS

// OTA CHARACTERISTICS //
export const OTA_UUID = "58f93211-63c5-4b0b-b4e6-544c559417d7";
export const FIRMWARE_UUID = "37187af3-defd-46df-a8de-881c0b20d8b3";
export const SOFTWARE_UPDATING_CHAR_UUID = "a0ee1ea6-2b18-4ae6-aa87-0238dde7d760";
export const SOFTWARE_STATUS_CHAR_UUID = "2d393ed3-ed78-4d57-900a-d3e46296f92d";
// END OTA CHARACTERISTICS //

// SETTINGS CHARACTERISTICS //
export const LONG_TERM_SLEEP_UUID = "0104b643-56b0-4dd8-85c7-6bd00f9c732e";
export const CUSTOM_BUTTON_UPDATE_UUID = "795a9433-cf23-4550-80b5-70a0c9413cac";
export const HEADLIGHT_MOVEMENT_DELAY_UUID = "859290b7-32f5-4afd-80fd-832b95bc5a4b";
export const HEADLIGHT_MOTION_IN_UUID = "5cdfa4ac-31f5-439b-af8d-ec09a808ce9d";
export const SLEEPY_SETTINGS_UUID = "bf133860-e47e-43e3-b1ed-cd87a1d9cb63";
export const UNPAIR_UUID = "c67c4fd1-21ce-4a75-bd16-629f990e575d";
export const RESET_UUID = "a55946b8-1978-4522-8a29-27d17e21b092";

export const CLIENT_MAC_UUID = "f61146f2-791d-4ef7-95aa-b565097f69c2"

export const SCAN_TIME_SECONDS = 30 * 1000;


// export const UPDATE_URL = "https://update-server.netlify.app/.netlify/functions/api/update";
// export const UPDATE_URL = "http://10.197.10.42:3000/.netlify/functions/api/update";
export const UPDATE_URL = "http://172.20.9.16:3000/.netlify/functions/api/update";

export const DEFAULT_COMMAND_DATA = [
  [
    {
      name: "Left Up",
      value: 4,
    },
    {
      name: "Left Down",
      value: 5,
    },

  ],
  [
    {
      name: "Both Up",
      value: 1
    },
    {
      name: "Both Down",
      value: 2,
    },

  ],
  [
    {
      name: "Right Up",
      value: 7,
    },
    {
      name: "Right Down",
      value: 8,
    },

  ]
];

export const DEFAULT_WINK_DATA = [{
  name: "Left Wink",
  value: 6,
},
{
  name: "Both Blink",
  value: 3,
},
{
  name: "Right Wink",
  value: 9,
}];

export const SETTINGS_DATA: Array<{
  pageName: string;
  pageSymbol: string;
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
      pageName: "System Terms of Use",
      navigationName: "TermsOfUse",
      pageSymbol: "document-text-outline",
    }
  ]

// Maps english to actual value
export const buttonBehaviorMap = {
  "Default Behavior": 1,
  "Left Wink": 2,
  "Left Wink x2": 3,
  "Right Wink": 4,
  "Right Wink x2": 5,
  "Both Blink": 6,
  "Both Blink x2": 7,
  "Left Wave": 8,
  "Right Wave": 9,
} as const;

export const buttonBehaviorMapReversed = {
  1: "Default Behavior",
  2: "Left Wink",
  3: "Left Wink x2",
  4: "Right Wink",
  5: "Right Wink x2",
  6: "Both Blink",
  7: "Both Blink x2",
  8: "Left Wave",
  9: "Right Wave",
} as const;

export enum ButtonStatus {
  DOWN = 0,
  UP = 1,
}

export enum DefaultCommandValue {
  BOTH_UP = 1,
  BOTH_DOWN,
  BOTH_BLINK,
  LEFT_UP,
  LEFT_DOWN,
  LEFT_WINK,
  RIGHT_UP,
  RIGHT_DOWN,
  RIGHT_WINK,
  LEFT_WAVE,
  RIGHT_WAVE
}

export const DefaultCommandValueEnglish = ["Both Up", "Both Down", "Both Blink", "Left Up", "Left Down", "Left Wink", "Right Up", "Right Down", "Right Wink", "Left Wave", "Right Wave"] as const;

export const countToEnglish = ["Single Press", "Double Press", "Triple Press", "Quadruple Press", "Quintuple Press", "Sextuple Press", "Septuple Press", "Octuple Press", "Nonuple Press"];
export enum BehaviorEnum {
  DEFAULT = 1,
  LEFT_WINK,
  LEFT_WINK_X2,
  RIGHT_WINK,
  RIGHT_WINK_X2,
  BOTH_BLINK,
  BOTH_BLINK_X2,
  LEFT_WAVE,
  RIGHT_WAVE,
}

type HexNumber = `#${string}`;

export interface ThemeColors {
  primary: HexNumber;
  backgroundPrimaryColor: HexNumber;
  backgroundSecondaryColor: HexNumber;
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
    bottomTabsBackground: "#ffffff",
    bottomTabsTextColor: "#141414",
    bottomTabsPill: "#f5ebdf",
    dropdownColor: "#e8e8e8",
    buttonColor: "#bd9664",
    disabledButtonColor: "#dbdbdb",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#000000",
    textColor: "#141414",
  }

  export const brilliantBlack: ThemeColors = {
    primary: "#550000",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#262629",
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
  }

  export const classicRed: ThemeColors = {
    primary: "#c8102e",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    bottomTabsBackground: "#ffffff",
    bottomTabsTextColor: "#141414",
    bottomTabsPill: "#ffffff",
    dropdownColor: "#37373b",
    buttonColor: "#c8102e", // Classic Red
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
  }

  export const sunburstYellow: ThemeColors = {
    primary: "#ffcc00",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    bottomTabsBackground: "#ffffff",
    bottomTabsTextColor: "#141414",
    bottomTabsPill: "#ffffff",
    dropdownColor: "#37373b",
    buttonColor: "#ffcc00", // Sunburst Yellow
    disabledButtonColor: "#878787",
    buttonTextColor: "#141414",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
  }

  export const marinerBlue: ThemeColors = {
    primary: "#0033a0",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    bottomTabsBackground: "#ffffff",
    bottomTabsTextColor: "#141414",
    bottomTabsPill: "#ffffff",
    dropdownColor: "#37373b",
    buttonColor: "#0033a0", // Marina Blue
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
  }

  export const britishRacingGreen: ThemeColors = {
    primary: "#004d26",
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    bottomTabsBackground: "#ffffff",
    bottomTabsTextColor: "#141414",
    bottomTabsPill: "#ffffff",
    dropdownColor: "#37373b",
    buttonColor: "#004d26", // British Racing Green
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
  }
}