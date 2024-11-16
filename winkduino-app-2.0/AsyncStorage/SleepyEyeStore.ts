import AsyncStorage from "@react-native-async-storage/async-storage";

export class SleepyEyeStore {
    static async save(side: "left" | "right", value?: number) {
        if (!value) {
            try {
                await AsyncStorage.removeItem(`${side}-sleepy-eye`);
                return;
            } catch (err) {
                return err;
            }
        }

        if (value > 100 || value < 0) return false;
        try {
            await AsyncStorage.setItem(`${side}-sleepy-eye`, value.toString());
        } catch (err) {
            return err;
        }
    }

    static async get(side: "left" | "right") {
        try {
            const value = await AsyncStorage.getItem(`${side}-sleepy-eye`);
            if (!value) return undefined;
            else return parseFloat(value);
        } catch (err) { };
    }

    static async setWaveDelay(delay: number) {
        await AsyncStorage.setItem("wave-delay", delay.toString());
    }
    static async getWaveDelay() {
        return await AsyncStorage.getItem("wave-delay");
    }
    static async resetWaveDelay() {
        await AsyncStorage.removeItem("wave-delay");
    }
}