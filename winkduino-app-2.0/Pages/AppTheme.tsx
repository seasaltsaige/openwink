import { Modal, View, Text, ActivityIndicator, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { useColorTheme } from "../hooks/useColorTheme";
import DropDownPicker from "react-native-dropdown-picker";
import ColorPicker from "react-native-wheel-color-picker";
import { OpacityButton } from "../Components/OpacityButton";
import { getBackgroundColor, isValidHex } from "../helper/Functions";

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




  useEffect(() => {
    //@ts-ignore
    setTypedTheme(colorTheme[selectedTheme])
  }, [colorTheme])

  useEffect(() => {
    //@ts-ignore
    setTypedTheme(colorTheme[selectedTheme])
  }, []);

  return (
    <Modal
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
            borderWidth: 2,
            rowGap: 15,
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
            theme={getBackgroundColor(colorTheme.backgroundSecondaryColor) ? "DARK" : "LIGHT"}
            containerStyle={{ width: "90%" }}

            style={{
              backgroundColor: colorTheme.backgroundSecondaryColor,
              borderColor: colorTheme.backgroundSecondaryColor,
            }}
            searchContainerStyle={{
              backgroundColor: colorTheme.backgroundSecondaryColor,
              borderColor: colorTheme.backgroundSecondaryColor,
            }}
            listItemContainerStyle={{
              backgroundColor: colorTheme.backgroundSecondaryColor,
              borderColor: colorTheme.backgroundSecondaryColor,
            }}
            textStyle={{
              color: colorTheme.textColor,
              fontSize: 17
            }}
            dropDownContainerStyle={{
              backgroundColor: colorTheme.backgroundSecondaryColor,
              borderColor: colorTheme.backgroundSecondaryColor,
            }}

          />

          <View style={{ width: "95%", height: 245 }}>
            <ColorPicker
              swatches={false}
              thumbSize={20}
              discrete={false}
              sliderSize={20}
              wheelLoadingIndicator={
                <ActivityIndicator
                  size={20}
                />
              }
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
  )
}