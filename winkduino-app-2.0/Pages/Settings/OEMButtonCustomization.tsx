import { Image, Modal, ScrollView, Text, TextInput, View } from "react-native";
import { buttonBehaviorMap, ButtonBehaviors } from "../../AsyncStorage/CustomOEMButtonStore";
import { defaults } from "../../hooks/useColorTheme";
import { Device } from "react-native-ble-plx";
import { OpacityButton } from "../../Components/OpacityButton";
import { useEffect, useState } from "react";
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


  const [delay, setDelay] = useState(500);
  const [setFunctions, setSetFunctions] = useState([
    { behavior: buttonBehaviorMap["Default Behavior"], behaviorEnglish: "Default Behavior" },
  ]);

  useEffect(() => {
    (async () => {

    })();
  }, [props.visible]);

  // const hexToRgb = (hex: string) => {
  //   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  //   return result ? {
  //     r: parseInt(result[1], 16),
  //     g: parseInt(result[2], 16),
  //     b: parseInt(result[3], 16)
  //   } : null;

  // }

  // const closeColor = (color: string) => {
  //   const rgbValue = hexToRgb(color);
  //   if (rgbValue) {
  //     const lum = (0.2126 * rgbValue.r + 0.7152 * rgbValue.g + 0.0722 * rgbValue.b) / 255;
  //     console.log(lum);
  //     if (lum > 0.5)
  //       return "black";
  //     else
  //       return "white";
  //   }
  // }

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
        {/* Page Name */}
        <Text
          style={{
            width: "90%",
            textAlign: "center",
            color: props.colorTheme.headerTextColor,
            fontSize: 27,
            marginTop: 30,
            fontWeight: "bold"
          }}
        >
          Retractor Button Customization
        </Text>
        {/* Description? */}
        <Text
          style={{
            color: props.colorTheme.textColor,
            width: "90%",
            textAlign: "center",
            fontSize: 16,
          }}
        >
          On this page you will be able to customize the behavior of pressing the OEM button in your car. You are able to customize up to 10 button presses worth of actions.
          {"\n\n"}<Text style={{ fontWeight: "bold", fontSize: 18 }}>WARNING:</Text>{"\n"}It is <Text style={{ fontWeight: "bold" }}>HIGHLY</Text> recommended to leave the single button press as the default behavior.
        </Text>

        {/* Set max delay between presses */}
        <View
          style={{
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start"
          }}
        >
          {/* Include 'disclaimers' about tradeoffs */}
          <Text
            style={{
              textAlign: "center",
              color: props.colorTheme.headerTextColor,
              fontSize: 23,
              marginTop: 30,
              fontWeight: "bold"
            }}
          >
            Button Delay Sensitivity
          </Text>

          <Text
            style={{
              color: props.colorTheme.textColor,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            This section allows you to customize the sensitivity of the max delay between button presses.
            Lowering this value means you will have to press the button faster to register multi-button presses.
            Raising this value can cause unwanted delay after finishing the sequence.
          </Text>




        </View>

        {/* Create view */}
        <View>
          {/* Creating adds to the end of the list */}
          {/* Deleting removes, then moves the rest up to fit in */}
        </View>

        <View>
          {
            setFunctions.map((value, i) => <View>
              <Text>
                {countToEnglish[i]}
              </Text>
              <Text>
                {value.behaviorEnglish}
              </Text>
              <View>
                <Text>Update Behavior</Text>
                <TextInput />
              </View>
            </View>)
          }
        </View>



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