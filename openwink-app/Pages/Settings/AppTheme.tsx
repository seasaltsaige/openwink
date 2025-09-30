import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import { ColorTheme } from "../../helper/Constants";
import { LongButton } from "../../Components/LongButton";
import { HeaderWithBackButton } from "../../Components";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppTheme() {
  const {
    colorTheme,
    themeName,
    theme,
    setTheme,
    reset,
  } = useColorTheme();

  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="App Theme"
        headerTextStyle={theme.settingsHeaderText}
      />


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
            <LongButton
              key={val}
              pressableStyle={val === currentTheme ? { backgroundColor: ColorTheme[val as keyof typeof ColorTheme.themeNames].buttonColor } : {}}
              icons={{ names: [null, val === currentTheme ? "checkmark-circle" : "ellipse-outline"], size: [null, 22] }}
              onPress={() => {
                setCurrentTheme(val as keyof typeof ColorTheme.themeNames);
                setTheme(val as keyof typeof ColorTheme.themeNames);
              }}
              text={ColorTheme.themeNames[val as keyof typeof ColorTheme.themeNames]}
            />
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
    </SafeAreaView>
  )
}