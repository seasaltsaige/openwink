import AsyncStorage from "@react-native-async-storage/async-storage";

const MAC_ADDR_KEY = "mac-addr";
const VERSION_KEY = "firmware-version"

export class DeviceMACStore {
  static async getStoredMAC() {
    const MAC = await AsyncStorage.getItem(MAC_ADDR_KEY);
    if (!MAC) return undefined;
    else return MAC;
  }

  static async setMAC(mac: string) {
    await AsyncStorage.setItem(MAC_ADDR_KEY, mac);
  }

  static async forgetMAC() {
    await AsyncStorage.removeItem(MAC_ADDR_KEY);
  }

  static async setFirmwareVersion(firmware: string) {
    await AsyncStorage.setItem(VERSION_KEY, firmware);
  }

  static async removeFirmwareVersion() {
    await AsyncStorage.removeItem(VERSION_KEY);
  }

  static async getFirmwareVersion() {
    return await AsyncStorage.getItem(VERSION_KEY);
  }
}