import { ConfigContext, ExpoConfig } from '@expo/config';
import dotenv from 'dotenv';

dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "openwink-app",
  slug: process.env.EXPO_SLUG || "openwink",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
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
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
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
    ]
  ],
  owner: process.env.EXPO_OWNER,
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID
    }
  }
});