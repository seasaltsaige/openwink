import AsyncStorage from "@react-native-async-storage/async-storage";
const AUTO_CONNECT_KEY = "auto-reconnect-setting";
export class AutoConnectStore {
    static async enable() {
        try {
            await AsyncStorage.removeItem(AUTO_CONNECT_KEY);
        } catch (err) {
            return err;
        }
    }

    static async disable() {
        try {
            await AsyncStorage.setItem(AUTO_CONNECT_KEY, "disabled");
        } catch (err) {
            return err;
        }
    }

    static async get() {
        try {
            const value = await AsyncStorage.getItem(AUTO_CONNECT_KEY);
            if (value === null) return undefined;
            else return value;
        } catch (err) { }
    }
}