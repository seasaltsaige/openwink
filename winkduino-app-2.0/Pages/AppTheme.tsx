import { Modal, View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ThemeStore } from "../AsyncStorage/ThemeStore";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";
import { useColorTheme } from "../hooks/useColorTheme";
import DropDownPicker from "react-native-dropdown-picker";
import ColorPicker from "react-native-wheel-color-picker";
import { OpacityButton } from "../Components/OpacityButton";

export function AppTheme(props: { visible: boolean; close: () => void; }) {

    const [themeOptions, setThemeOptions] = useState([
        { label: "Primary Background", value: "backgroundPrimaryColor" },
        { label: "Secondary Background", value: "backgroundSecondaryColor" },
        { label: "Button Color", value: "buttonColor" },
        { label: "Disabled Button Color", value: "disabledButtonColor" },
        { label: "Button Text Color", value: "buttonTextColor" },
        { label: "Disabled Button Text Color", value: "disabledButtonTextColor" },
        { label: "Header Text Color", value: "headerTextColor" },
        { label: "Text Color", value: "textColor" },
    ])

    const { colorTheme, revertDefaults, resetTheme, setTheme } = useColorTheme();

    const [selectedTheme, setSelectedTheme] = useState("backgroundPrimaryColor");
    const [open, setOpen] = useState(false);
    const [lastChange, setLastChange] = useState(Date.now());
    const updateTheme = (color: string) => {
        if ((Date.now() - lastChange) < 250) return;
        setLastChange(Date.now());
        //@ts-ignore
        setTheme(selectedTheme, color);
    }

    const hexToRgb = (hex: string) => {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;

    }

    const getBackgroundColor = (color: string) => {
        const rgbValue = hexToRgb(color);
        if (rgbValue) {
            const lum = (0.2126 * rgbValue.r + 0.7152 * rgbValue.g + 0.0722 * rgbValue.b) / 255;
            if (lum > 0.5)
                return "black";
            else
                return "white";
        }
    }

    return <Modal
        transparent={false}
        visible={props.visible}
        animationType="slide"
        hardwareAccelerated
        onRequestClose={() => props.close()}
    >
        <View
            style={{
                backgroundColor: colorTheme.backgroundPrimaryColor,
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                rowGap: 20
            }}
        // contentContainerStyle={{
        //     display: "flex",
        //     alignItems: "center",
        //     justifyContent: "flex-start",
        //     rowGap: 20
        // }}>
        >
            <Text style={{ color: colorTheme.headerTextColor, fontSize: 25, fontWeight: "500", marginTop: 20, }}>
                Edit Color Theme
            </Text>
            <Text style={{ color: colorTheme.textColor, fontSize: 16 }}>
                Change your apps color theme here
            </Text>
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingHorizontal: 15,
                    rowGap: 10
                }}>

                <Text style={{
                    // @ts-ignore
                    color: getBackgroundColor(colorTheme[selectedTheme]),
                    // @ts-ignore
                    backgroundColor: colorTheme[selectedTheme],
                    fontSize: 18,
                    fontWeight: "bold",
                    padding: 10,
                    borderRadius: 5,
                }}>
                    Selected Theme: {selectedTheme}
                </Text>

                <View style={{ width: "90%", height: "40%" }}>
                    <ColorPicker
                        swatches={false}
                        thumbSize={20}
                        discrete={false}
                        sliderSize={20}
                        wheelLoadingIndicator={<ActivityIndicator size={20} />}
                        //@ts-ignore
                        color={colorTheme[selectedTheme]}
                        //@ts-ignore
                        onColorChange={(color) => updateTheme(color)}
                    />
                </View>


                <DropDownPicker
                    items={themeOptions}
                    open={open}
                    setOpen={setOpen}
                    setValue={setSelectedTheme}
                    value={selectedTheme}
                    setItems={setThemeOptions}
                    placeholder="Select a theme component"
                    containerStyle={{ width: "90%" }}
                />

                <View style={{ display: "flex", flexDirection: "column", rowGap: 20 }}>
                    <OpacityButton
                        text="Reset Theme"
                        //@ts-ignore
                        onPress={() => resetTheme(selectedTheme)}
                        buttonStyle={{
                            width: 200,
                            height: 50,
                            borderRadius: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: colorTheme.buttonColor
                        }}
                        textStyle={{ fontSize: 20, color: colorTheme.buttonTextColor }}
                    />


                    <OpacityButton
                        text="Reset All Themes"
                        onPress={() => revertDefaults()}
                        buttonStyle={{
                            width: 200,
                            height: 50,
                            borderRadius: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: colorTheme.buttonColor
                        }}
                        textStyle={{ fontSize: 20, color: colorTheme.buttonTextColor }}
                    />
                </View>
            </View>

        </View>

    </Modal>
}