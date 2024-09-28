import { Modal, View, Text, ScrollView, ActivityIndicator, TextInput } from "react-native";
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
  ]);

  const { colorTheme, revertDefaults, resetTheme, setTheme } = useColorTheme();

  const [typedTheme, setTypedTheme] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("backgroundPrimaryColor");
  const [open, setOpen] = useState(false);
  const [lastChange, setLastChange] = useState(Date.now());
  const updateTheme = (color: string) => {
    if ((Date.now() - lastChange) < 40) return;
    setLastChange(Date.now());
    //@ts-ignore
    setTheme(selectedTheme, color);
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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

  const isValidHex = (str: string) => {
    const hexaPattern = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
    return hexaPattern.test(str);
  }


  useEffect(() => {
    //@ts-ignore
    setTypedTheme(colorTheme[selectedTheme])
  }, [colorTheme])

  useEffect(() => {
    //@ts-ignore
    setTypedTheme(colorTheme[selectedTheme])
  }, []);

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
        rowGap: 15
      }}>
      <Text style={{ color: colorTheme.headerTextColor, fontSize: 25, fontWeight: "500", marginTop: 10, }}>
        Edit Color Theme
      </Text>
      <Text style={{ color: colorTheme.textColor, fontSize: 16 }}>
        Change your apps color theme here
      </Text>

      <View
        style={{
          width: "90%",
          backgroundColor: colorTheme.backgroundSecondaryColor,
          paddingVertical: 20,
          paddingHorizontal: 10,
          borderRadius: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 15,
        }}>
        <View style={{ display: "flex", rowGap: 5, flexDirection: "column", alignContent: "center", justifyContent: "flex-start" }}>
          <Text style={{ color: colorTheme.headerTextColor, fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
            Color Hex
          </Text>
          <Text style={{ color: colorTheme.textColor, fontSize: 17, textAlign: "center" }}>
            You can edit the colors hex directly if preferred
          </Text>
          <TextInput
            style={{
              borderColor: getBackgroundColor(colorTheme.backgroundSecondaryColor),
              borderWidth: 1,
              paddingHorizontal: 20,
              paddingVertical: 5,
              borderRadius: 5,
              color: colorTheme.textColor,
              fontSize: 18,
            }}
            //@ts-ignore
            value={typedTheme}
            maxLength={7}
            onChangeText={(text) => {
              if (text.length > 6)
                if (isValidHex(text)) updateTheme(text);
              setTypedTheme(text);
            }}
          />
        </View>

      </View>

      <View
        style={{
          width: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingVertical: 15,
          borderRadius: 5,
          borderColor: colorTheme.backgroundSecondaryColor,
          borderWidth: 2
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
          Selected Theme: {themeOptions.find(v => v.value === selectedTheme)?.label}
        </Text>


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

        <View style={{ width: "95%", height: 245 }}>
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
      </View>

      <View style={{ display: "flex", flexDirection: "row", columnGap: 20, }}>
        <OpacityButton
          text="Reset Theme"
          //@ts-ignore
          onPress={() => resetTheme(selectedTheme)}
          buttonStyle={{
            width: 150,
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
          text="Reset All"
          onPress={() => revertDefaults()}
          buttonStyle={{
            width: 150,
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

      <OpacityButton
        text="Close"
        onPress={() => props.close()}
        buttonStyle={{
          width: 150,
          height: 50,
          borderRadius: 5,
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colorTheme.buttonColor
        }}
        textStyle={{ fontSize: 20, color: colorTheme.buttonTextColor }}
      />
    </View>


  </Modal>
}