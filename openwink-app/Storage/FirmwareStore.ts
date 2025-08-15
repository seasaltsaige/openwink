import AsyncStorage from "@react-native-async-storage/async-storage";

const VERSION_KEY = "firmware-version";

export abstract class FirmwareStore {
  static async setFirmwareVersion(firmware: string): Promise<void | null> {
    try {
      await AsyncStorage.setItem(VERSION_KEY, firmware);
    } catch (err) {
      return null;
    }
  }

  static async forgetFirmwareVersion(): Promise<void | null> {
    try {
      await AsyncStorage.removeItem(VERSION_KEY);
    } catch (err) {
      return null;
    }
  }

  static async getFirmwareVersion(): Promise<string | null> {
    try {
      const version = await AsyncStorage.getItem(VERSION_KEY);
      if (!version) return "";
      else return version;
    } catch (err) {
      return null;
    }
  }
}