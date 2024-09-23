import AsyncStorage from "@react-native-async-storage/async-storage";

const defaults = {
    backgroundPrimaryColor: "#141414",
    backgroundSecondaryColor: "#1e1e1e",
    buttonColor: "#800020",
    disabledButtonColor: "#878787",
    buttonTextColor: "#ffffff",
    disabledButtonTextColor: "#ffffff",
    headerTextColor: "#ffffff",
    textColor: "#ffffff",
}

export class ThemeStore {
    static async setTheme(key: keyof typeof defaults, color: string) {
        try {
            await AsyncStorage.setItem(`color-theme-${key}`, color);
        } catch (err) {
            console.log(err);
        }
    }

    static async getStoredTheme() {
        const theme: Partial<typeof defaults> = {}
        try {
            for (const key in defaults) {
                const stored = await AsyncStorage.getItem(`color-theme-${key}`);
                if (stored === null) continue;
                //@ts-ignore
                theme[key] = stored;
            }

            return theme;
        } catch (err) {
            console.log(err);
        }
    }

    static async resetAllThemes() {
        for (const key in defaults) {
            try {
                await AsyncStorage.removeItem(`color-theme-${key}`);
            } catch (err) {
                console.log(err);
            }
        }
    }

    static async resetTheme(theme: keyof typeof defaults) {
        try {
            await AsyncStorage.removeItem(`color-theme-${theme}`);
        } catch (err) {
            console.log(err);
        }
    }
}