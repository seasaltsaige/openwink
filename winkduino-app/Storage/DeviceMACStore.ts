import AsyncStorage from "@react-native-async-storage/async-storage";
const MAC_ADDR_KEY = "mac-addr";

export abstract class DeviceMACStore {
    static async getStoredMAC(): Promise<string | null> {
        try {
            const mac = await AsyncStorage.getItem(MAC_ADDR_KEY);
            if (!mac) return "";
            else return mac;
        } catch (err) {
            return null;
        }
    }

    static async setMAC(mac: string): Promise<void | null> {
        try {
            await AsyncStorage.setItem(MAC_ADDR_KEY, mac);
        } catch (err) {
            return null;
        }
    }

    static async forgetMAC(): Promise<void | null> {
        try {
            await AsyncStorage.removeItem(MAC_ADDR_KEY);
        } catch (err) {
            return null;
        }
    }
}