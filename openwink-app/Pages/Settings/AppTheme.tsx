import { Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorTheme } from "../../hooks/useColorTheme";
import { ColorTheme } from "../../helper/Constants";
import { LongButton } from "../../Components/LongButton";
import { HeaderWithBackButton } from "../../Components";

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
      <View style={[theme.contentContainer, { rowGap: 10, marginTop: 10, }]}>

        <Text style={theme.subSettingHeaderText}>
          Header Text
        </Text>
        <Text style={theme.text}>
          This is an example of what header text, body text, and buttons will look like throughout the app, with different themes applied.
        </Text>
      </View>

      <View style={{
        display: "flex",
        flex: 1,
        // flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
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
          style={({ pressed }) => [pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons, { marginBottom: 15, paddingRight: 15, width: 185, justifyContent: "space-evenly", }]}
          onPress={() => reset()}
        >

          <IonIcons name="refresh-outline" color={colorTheme.headerTextColor} size={19} style={{ marginTop: 1, }} />
          <Text
            style={theme.rangeSliderButtonsText}
          >
            Reset theme
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}