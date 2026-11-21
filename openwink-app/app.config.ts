import { ConfigContext, ExpoConfig } from '@expo/config';
import dotenv from 'dotenv';

require('ts-node/register/transpile-only');

dotenv.config({ path: ['.env.local', '.env'] });

const UPDATE_SERVER_BASE = process.env.EXPO_PUBLIC_UPDATE_SERVER_BASE ?? "https://update-server.netlify.app";
const OTA_API_KEY = process.env.EXPO_PUBLIC_OTA_API_KEY ?? "Cb8VHA})liX~azNU&+;KV{22:`16'S{@g;d<$Cu@H0`0k/Qh>]";

const variant = process.env.APP_VARIANT ?? 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant === "development" ? "OpenWink Development" : "OpenWink",
  slug: process.env.EXPO_SLUG ?? "openwink",
  version: "2.1.4",
  runtimeVersion: "2.1.0",
  updates: {
    enabled: true,
    checkAutomatically: "NEVER",
    url: `${UPDATE_SERVER_BASE}/.netlify/functions/api/update/app/manifest`,
    fallbackToCacheTimeout: 0,
    requestHeaders: {
      authorization: OTA_API_KEY,
    },
    codeSigningCertificate: "./certs/certificate.pem",
    codeSigningMetadata: {
      keyid: "openwink",
      alg: "rsa-v1_5-sha256",
    },
  },
  orientation: "portrait",
  icon: "./assets/icon_british_racing_green.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash_transparent.png",
    resizeMode: "contain",
    backgroundColor: "#004d26",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: variant === "development" ? "com.seasaltsaige.openwink.dev" : "com.seasaltsaige.openwink",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon_british_racing_green_android.png",
      backgroundColor: "#004d26"
    },
    package: variant === "development" ? "com.seasaltsaige.openwink.dev" : "com.seasaltsaige.openwink"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    [
      "react-native-ble-plx",
      {
        isBackgroundEnabled: false,
        neverForLocation: true,
        bluetoothAlwaysPermission:
          "OpenWink uses Bluetooth to discover, connect to, and control your vehicle's OpenWink headlight module.",
      }
    ],
    "expo-font",
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.25",
          useLegacyPackaging: variant !== "production"
        },
        ios: {
          deploymentTarget: "15.1"
        }
      }
    ],
    "./Plugins/WithDynamicSplashTheme",
    [
      "@howincodes/expo-dynamic-app-icon",
      {
        white: {
          ios: "./assets/icon_crystal_white.png",
          android: "./assets/icon_crystal_white_android.png"
        },
        black: {
          ios: "./assets/icon_burgundy.png",
          android: "./assets/icon_burgundy_android.png"
        },
        red: {
          ios: "./assets/icon_classic_red.png",
          android: "./assets/icon_classic_red_android.png"
        },
        yellow: {
          ios: "./assets/icon_sunburst_yellow.png",
          android: "./assets/icon_sunburst_yellow_android.png"
        },
        blue: {
          ios: "./assets/icon_marina_blue.png",
          android: "./assets/icon_marina_blue_android.png"
        },
        green: {
          ios: "./assets/icon_british_racing_green.png",
          android: "./assets/icon_british_racing_green_android.png"
        }
      }
    ],
    ...(variant === "development"
      ? [
        [
          "expo-dev-client",
          {
            launchMode: "most-recent",
          },
        ] as [string, any],
      ]
      : []),
  ],
  owner: process.env.EXPO_OWNER ?? "seasaltsaige",
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID ?? "6f04b4b4-4888-49c9-8dd1-51111d08e58b"
    }
  }
});
