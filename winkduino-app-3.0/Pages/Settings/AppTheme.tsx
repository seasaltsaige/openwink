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
    setTheme,
    update,
  } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [isBackPressed, setIsBackPressed] = useState(false);
  const backPressed = (bool: boolean) => setIsBackPressed(bool);

  const [currentTheme, setCurrentTheme] = useState("brilliantBlack" as keyof typeof ColorTheme.themeNames);


  useFocusEffect(() => {
    setCurrentTheme(themeName);
  });

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 25,
      }}
    >

      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>

        <Pressable style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 10,
          height: "100%"
        }}
          onPressIn={() => backPressed(true)}
          onPressOut={() => backPressed(false)}
          onPress={() => navigation.goBack()}
        >
          <IonIcons name="chevron-back-outline" color={isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

          <Text style={{
            color: isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
            fontWeight: "500",
            fontSize: 22
          }}>{back}</Text>
        </Pressable>


        <Text style={{
          fontSize: 35,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        }}
        >App Theme</Text>

      </View>


      {/* Example text/items */}
      <View
        style={{
          width: "80%",
        }}
      >
        <Text
          style={{
            color: colorTheme.headerTextColor,
            fontWeight: "bold",
            fontSize: 23,
          }}
        >
          Example Text
        </Text>
        <Text
          style={{
            color: colorTheme.textColor,
            fontWeight: "400",
            fontSize: 16,
            textAlign: "center",
          }}
        >
          This is an example of what header text, body text, and buttons will look like throughout the app, with different themes applied.
        </Text>
      </View>


      {
        Object.keys(ColorTheme.themeNames).map((val, i) => (
          <Pressable
            style={({ pressed }) => ({
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "60%",
              // borderWidth: 1,
              // borderColor: "pink",
              backgroundColor: (pressed || val === currentTheme) ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              padding: 10,
              paddingHorizontal: 25,
              borderRadius: 8,
            })}

            onPress={async () => {
              await setTheme(val as keyof typeof ColorTheme.themeNames);
              await update();
              setCurrentTheme(val as keyof typeof ColorTheme.themeNames);
            }}
          >
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "500",
                fontSize: 16,
              }}
            >
              {
                //@ts-ignore
                ColorTheme.themeNames[val]
              }
            </Text>
            <IonIcons name={val === currentTheme ? "checkmark-circle" : "ellipse-outline"} size={20} color={colorTheme.headerTextColor} />
          </Pressable>
        ))
      }

      {/* TODO: add reset button (partially to even out screen weights) */}

    </View>
  )
}