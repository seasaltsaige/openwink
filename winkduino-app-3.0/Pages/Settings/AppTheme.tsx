import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useNavigationState, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ColorTheme } from "../../helper/Constants";

export function AppTheme() {
  const {
    colorTheme,
    themeName,
    theme,
    setTheme,
    update,
    reset,
  } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [currentTheme, setCurrentTheme] = useState("brilliantBlack" as keyof typeof ColorTheme.themeNames);

  useFocusEffect(() => {
    setCurrentTheme(themeName);
  });

  return (
    <View style={theme.container}>

      <View style={theme.headerContainer}>

        <Pressable
          style={theme.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          {
            ({ pressed }) => (
              <>
                <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />
                <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                  {back}
                </Text>
              </>
            )}
        </Pressable>


        <Text style={theme.settingsHeaderText}>
          App Theme
        </Text>

      </View>


      {/* Example text/items */}
      <View style={theme.contentContainer}>

        <Text style={theme.subSettingHeaderText}>
          Example Text
        </Text>
        <Text style={theme.text}>
          This is an example of what header text, body text, and buttons will look like throughout the app, with different themes applied.
        </Text>
      </View>


      <View style={theme.homeScreenButtonsContainer}>
        {
          Object.keys(ColorTheme.themeNames).map((val, i) => (

            <Pressable
              style={({ pressed }) => [(pressed || val === currentTheme) ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer, { backgroundColor: (pressed || val === currentTheme) ? ColorTheme[val as keyof typeof ColorTheme.themeNames].buttonColor : colorTheme.backgroundSecondaryColor }]}
              key={i}
              onPress={async () => {
                setCurrentTheme(val as keyof typeof ColorTheme.themeNames);
                await setTheme(val as keyof typeof ColorTheme.themeNames);
              }}
            >
              <View style={theme.mainLongButtonPressableView}>
                <Text style={theme.mainLongButtonPressableText}>
                  {
                    ColorTheme.themeNames[val as keyof typeof ColorTheme.themeNames]
                  }
                </Text>
              </View>
              <IonIcons style={theme.mainLongButtonPressableIcon} name={val === currentTheme ? "checkmark-circle" : "ellipse-outline"} size={20} color={colorTheme.headerTextColor} />

            </Pressable>
          ))
        }

      </View>
      <Pressable
        style={({ pressed }) => [{ marginTop: 25 }, pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons]}
        onPress={() => reset()}
      >

        <IonIcons name="trash-outline" color={colorTheme.headerTextColor} size={18} />
        <Text
          style={theme.rangeSliderButtonsText}
        >
          Reset theme
        </Text>
      </Pressable>
    </View>
  )
}