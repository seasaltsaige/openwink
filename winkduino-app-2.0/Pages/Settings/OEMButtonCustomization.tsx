import { Image, Modal, ScrollView, View } from "react-native";
import { ButtonBehaviors } from "../../AsyncStorage/CustomOEMButtonStore";
import { defaults } from "../../hooks/useColorTheme";
import { Device } from "react-native-ble-plx";

import { useEffect } from "react";
import { OpacityButton } from "../../Components/OpacityButton";

interface SettingsProps {
  visible: boolean;
  close: () => void;
  colorTheme: typeof defaults;
  device: Device | null;
  updateButtonResponse: (presses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, state: ButtonBehaviors) => Promise<void>;
}


export function OEMButtonCustomization(props: SettingsProps) {

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;

  }

  const closeColor = (color: string) => {
    const rgbValue = hexToRgb(color);
    if (rgbValue) {
      const lum = (0.2126 * rgbValue.r + 0.7152 * rgbValue.g + 0.0722 * rgbValue.b) / 255;
      console.log(lum);
      if (lum > 0.5)
        return "black";
      else
        return "white";
    }
  }

  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
      onRequestClose={() => props.close()}
    >

      <ScrollView
        style={{ backgroundColor: props.colorTheme.backgroundPrimaryColor }}
        contentContainerStyle={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 25,
          position: "relative",
        }}>




        <OpacityButton
          buttonStyle={{
            borderRadius: 5,
            padding: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: props.colorTheme.buttonColor,
          }}
          textStyle={{
            fontSize: 20,
            color: props.colorTheme.buttonTextColor,
          }}
          text="Close"
          onPress={() => props.close()}
        />
        {/* <View style={{ width: "auto", height: "auto", margin: 20, alignSelf: "flex-start", position: "relative" }} onTouchStart={() => props.close()}> */}
        {/* 
        <OpacityButton
          buttonStyle={{ backgroundColor: props.colorTheme.buttonColor }}
          textStyle={{ color: props.colorTheme.buttonTextColor }}
          text="Hello"
          onPress={() => prompt("aa")}
        /> */}
        {/* <Image style={{ height: 30, width: 30 }}
            source={{
              uri: closeColor(props.colorTheme.backgroundPrimaryColor) === "black" ? "data:image/png;base64,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"
                : "data:image/png;base64,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"
            }}

          /> */}
        {/* </View> */}

      </ScrollView>

    </Modal>
  )
}