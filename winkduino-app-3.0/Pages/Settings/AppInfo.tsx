import { Linking, Pressable, Text, View } from "react-native";
import { nativeApplicationVersion } from "expo-application";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export function AppInfo() {

  const { colorTheme } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [isBackPressed, setIsBackPressed] = useState(false);
  const backPressed = (bool: boolean) => setIsBackPressed(bool);

  const openGithub = async () => {
    await Linking.openURL("https://github.com/seasaltsaige");
  }

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
          <Ionicons name="chevron-back-outline" color={isBackPressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

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
        >App Info</Text>

      </View>

      <View
        style={{
          display: "flex",
          flexDirection: "column",
          width: "90%",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        <Text
          style={{
            color: colorTheme.headerTextColor,
            fontWeight: "500",
            fontSize: 22,
          }}
        >
          {
            // TODO: Fetch update from some api...
            true && `Application version ${nativeApplicationVersion} is up to date`
          }
        </Text>
      </View>

      <View
        style={{
          display: "flex",
          position: "absolute",
          bottom: 20,
        }}>

        <Text
          style={{
            color: colorTheme.textColor,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Application developed and maintained by {
            <Pressable
              onPress={() => openGithub()}
            >
              {
                ({ pressed }) => <Text style={{
                  color: "#99c3ff",
                  textDecorationLine: pressed ? "underline" : "none"
                }}>
                  @seasaltsaige
                </Text>
              }

            </Pressable>
          }
        </Text>
      </View>

    </View >
  )
}