import { Image, Modal, ScrollView, Text, View } from "react-native";
import { ButtonBehaviors } from "../../AsyncStorage/CustomOEMButtonStore";
import { defaults } from "../../hooks/useColorTheme";
import { Device } from "react-native-ble-plx";
import { OpacityButton } from "../../Components/OpacityButton";
interface SettingsProps {
  visible: boolean;
  close: () => void;
  colorTheme: typeof defaults;
  device: Device | null;
  updateButtonResponse: (presses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, state: ButtonBehaviors) => Promise<void>;
  updateButtonDelay: (delay: number) => Promise<void>;
}


// press count - 1
// ie: 1 in position 0, 2 in position 1, etc
const countToEnglish = ["Single Press", "Double Press", "Triple Press", "Quadruple Press", "Quintuple Press", "Sextuple Press", "Septuple Press", "Octuple Press", "Nonuple Press", "Decuple Press"];

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

        {/* Create view */}
        <View>

        </View>

        {

        }



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

      </ScrollView>

    </Modal>
  )
}