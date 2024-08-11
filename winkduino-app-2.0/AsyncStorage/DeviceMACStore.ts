import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceId } from "react-native-ble-plx";

const MAC_ADDR_KEY = "mac-addr";

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
}