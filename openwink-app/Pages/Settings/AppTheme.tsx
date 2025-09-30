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
          ColorTheme.themeKeys.map((themeKey) =>
            <LongButton
              key={themeKey}
              pressableStyle={themeKey === themeName ? { backgroundColor: ColorTheme[themeKey].buttonColor } : {}}
              icons={{ names: [null, themeKey === themeName ? "checkmark-circle" : "ellipse-outline"], size: [null, 22] }}
              onPress={() => {
                setTheme(themeKey);
              }}
              text={ColorTheme.themeNames[themeKey]}
            />
          )
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