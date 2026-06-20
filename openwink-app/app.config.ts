import { ConfigContext, ExpoConfig } from '@expo/config';
import dotenv from 'dotenv';

require('ts-node/register/transpile-only');

dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "OpenWink",
  slug: process.env.EXPO_SLUG || "openwink",
  version: "1.0.2",
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
    bundleIdentifier: "com.seasaltsaige.openwink",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon_british_racing_green_android.png",
      backgroundColor: "#004d26"
    },
    permissions: [
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.ACCESS_FINE_LOCATION"
    ],
    package: "com.seasaltsaige.openwink"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "react-native-ble-plx",
    "expo-font",
    "expo-build-properties",
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.25"
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
    ]
  ],
  owner: process.env.EXPO_OWNER,
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID
    }
  }
});