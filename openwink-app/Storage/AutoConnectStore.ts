import AsyncStorage from "@react-native-async-storage/async-storage";
const AUTO_CONNECT_KEY = "auto-reconnect-setting";
export abstract class AutoConnectStore {

    static async enable(): Promise<void | null> {
        try {
            await AsyncStorage.removeItem(AUTO_CONNECT_KEY);
        } catch (err) {
            return null;
        }
    }

    static async disable(): Promise<void | null> {
        try {
            await AsyncStorage.setItem(AUTO_CONNECT_KEY, "disabled");
        } catch (err) {
            return null;
        }
    }

    static async get(): Promise<boolean | null> {
        try {
            const value = await AsyncStorage.getItem(AUTO_CONNECT_KEY);
            if (value === null) return true;
            else return false;
        } catch (err) {
            return null;
        }
    }

}