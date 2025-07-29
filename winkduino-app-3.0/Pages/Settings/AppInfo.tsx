import { Linking, Pressable, Text, View } from "react-native";
import { nativeApplicationVersion } from "expo-application";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";

export function AppInfo() {

  const { colorTheme, theme } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  // const [isBackPressed, setIsBackPressed] = useState(false);
  // const backPressed = (bool: boolean) => setIsBackPressed(bool);

  const openGithub = async () => {
    await Linking.openURL("https://github.com/seasaltsaige");
  }

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
            )
          }
        </Pressable>


        <Text style={theme.subSettingHeaderText}>
          App Info
        </Text>

      </View>

      {/* <View
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
      </View> */}

      <View style={theme.infoFooterContainer}>

        <Text style={theme.infoFooterText}>
          Application developed and maintained by
        </Text>
        <Pressable
          onPress={() => openGithub()}
        >
          {
            ({ pressed }) =>
              <Text style={[
                theme.infoFooterText
                , {
                  color: "#99c3ff",
                  textDecorationLine: pressed ? "underline" : "none"
                }]}>
                @seasaltsaige
              </Text>
          }

        </Pressable>
      </View>

    </View >
  )
}