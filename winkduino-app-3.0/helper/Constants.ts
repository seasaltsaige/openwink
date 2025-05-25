/** ---- BEGIN BLE UUID DEFINITIONS ---- **/
// Service for headlight movements
export const WINK_SERVICE_UUID = "a144c6b0-5e1a-4460-bb92-3674b2f51520"
// Service for OTA Update + OTA Status indication
export const OTA_SERVICE_UUID = "e24c13d7-d7c7-4301-903a-7750b09fc935"
// Service for Wink Module Settings
export const MODULE_SETTINGS_SERVICE_UUID = "cb5f7a1f-59f2-418e-b9d1-d6fc5c85a749"

// WINK CHARACTERISTICS //
export const HEADLIGHT_CHAR_UUID = "034a383c-d3e4-4501-b7a5-1c950db4f3c7"
export const BUSY_CHAR_UUID = "8d2b7b9f-c6a3-4f56-9f4f-2dc7d7873c18"
export const LEFT_STATUS_UUID = "c4907f4a-fb0c-440c-bbf1-4836b0636478"
export const RIGHT_STATUS_UUID = "784dd553-d837-4027-9143-280cb035163a"
export const LEFT_SLEEPY_EYE_UUID = "a8237fed-e0a4-4ecd-9881-9b5dbb3f5902"
export const RIGHT_SLEEPY_EYE_UUID = "bf133860-e47e-43e3-b1ed-cd87a1d9cb63"
export const SYNC_UUID = "eceed349-998f-46a2-9835-4f2db7552381"
// END WINK CHARACTERISTICS

// OTA CHARACTERISTICS //
export const OTA_UUID = "58f93211-63c5-4b0b-b4e6-544c559417d7"
export const FIRMWARE_UUID = "37187af3-defd-46df-a8de-881c0b20d8b3"
export const SOFTWARE_UPDATING_CHAR_UUID = "a0ee1ea6-2b18-4ae6-aa87-0238dde7d760"
export const SOFTWARE_STATUS_CHAR_UUID = "2d393ed3-ed78-4d57-900a-d3e46296f92d"
// END OTA CHARACTERISTICS //

// SETTINGS CHARACTERISTICS //
export const LONG_TERM_SLEEP_UUID = "0104b643-56b0-4dd8-85c7-6bd00f9c732e"
export const CUSTOM_BUTTON_UPDATE_UUID = "795a9433-cf23-4550-80b5-70a0c9413cac"
export const HEADLIGHT_MOVEMENT_DELAY_UUID = "859290b7-32f5-4afd-80fd-832b95bc5a4b"


export const SCAN_TIME_SECONDS = 30 * 1000;


export const UPDATE_URL = "https://update-server.netlify.app/.netlify/functions/api/update";
// export const UPDATE_URL = "http://192.168.0.11:3000/.netlify/functions/api/update";


type HexNumber = `#${string}`;

export interface Theme {
  backgroundPrimaryColor: HexNumber,
  backgroundSecondaryColor: HexNumber,
  dropdownColor: HexNumber,
  buttonColor: HexNumber,
  disabledButtonColor: HexNumber,
  buttonTextColor: HexNumber,
  disabledButtonTextColor: HexNumber,
  headerTextColor: HexNumber,
  textColor: HexNumber,
}

export namespace ColorTheme {

  export const themeNames = {
    crystalWhite: "Crystal White",
    brilliantBlack: "Brilliant Black",
    classicRed: "Classic Red",
    sunburstYellow: "Sunburst Yellow",
    marinerBlue: "Mariner Blue",
    britishRacingGreen: "British Racing Green",
  }


  export const crystalWhite: Theme = {
    backgroundPrimaryColor: "#f1f1f1",
    backgroundSecondaryColor: "#ffffff",
    dropdownColor: "#cccccc",
    buttonColor: "#bd9664",
    disabledButtonColor: "#aaaaaa",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#000000",
    textColor: "#141414",
  }

  export const brilliantBlack: Theme = {
    backgroundPrimaryColor: "#141414",
    dropdownColor: "#37373b",
    backgroundSecondaryColor: "#262629",
    buttonColor: "#550000", // Burgundy (default)
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
  }

  export const classicRed: Theme = {
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    buttonColor: "#c8102e", // Classic Red
    disabledButtonColor: "#5a0015",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#c8102e",
    textColor: "#ffffff",
  }

  export const sunburstYellow: Theme = {
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    buttonColor: "#ffcc00", // Sunburst Yellow
    disabledButtonColor: "#b38f00",
    buttonTextColor: "#141414",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#ffcc00",
    textColor: "#ffffff",
  }

  export const marinerBlue: Theme = {
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    buttonColor: "#0033a0", // Marina Blue
    disabledButtonColor: "#002275",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#0033a0",
    textColor: "#ffffff",
  }

  export const britishRacingGreen: Theme = {
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    buttonColor: "#004d26", // British Racing Green
    disabledButtonColor: "#eeeeee",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#bbbbbb",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
  }
}