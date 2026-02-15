import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";


interface ISettingsToolbar {
  reset: () => void;
  save: () => void;
  resetText: string;
  saveText: string;
  disabled: boolean;
}
export function SettingsToolbar({
  disabled,
  reset,
  resetText,
  save,
  saveText,
}: ISettingsToolbar) {
  const { colorTheme, theme } = useColorTheme();
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        rowGap: 18,
        alignItems: "center",
        columnGap: 25,
        justifyContent: "center",
        width: "110%",
        height: 60,
        flexDirection: "row",
        backgroundColor: colorTheme.backgroundSecondaryColor,
      }}>

      <Pressable
        style={{ flexDirection: "row", columnGap: 10, }}
        disabled={disabled}
        onPress={reset}
      >
        {({ pressed }) => (
          <>
            <Text
              style={[
                theme.rangeSliderButtonsText,
                {
                  fontSize: 15,
                  color: disabled ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  textDecorationColor: disabled ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  textDecorationLine: "underline",
                  textDecorationStyle: "solid",
                }
              ]}>
              {resetText}
            </Text>
            <IonIcons style={{ marginTop: 3.5 }} size={18} name="reload-outline" color={disabled ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
          </>
        )}
      </Pressable>


      <Pressable
        style={({ pressed }) => [
          disabled ?
            theme.rangeSliderButtonsDisabled :
            pressed ?
              theme.rangeSliderButtonsPressed :
              theme.rangeSliderButtons,
          {
            backgroundColor: disabled ? colorTheme.disabledButtonColor : pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
            borderRadius: 10,
            paddingVertical: 8,
          }
        ]}
        disabled={disabled}
        onPress={save}
      >
        <Text style={theme.rangeSliderButtonsText}>
          {saveText}
        </Text>
        <IonIcons size={22} name="download-outline" color={colorTheme.textColor} />
      </Pressable>



    </View>
  )
}