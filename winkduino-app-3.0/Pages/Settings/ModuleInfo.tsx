import { Linking, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";

export function ModuleInfo() {

  const { colorTheme, theme } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const openGithub = async (type: "module" | "software") => {
    if (type === "module")
      await Linking.openURL("https://github.com/pyroxenes");
    else if (type === "software")
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
          Module Info
        </Text>

      </View>




      <View style={[theme.infoFooterContainer, { height: 80, flexDirection: "column", rowGap: 5 }]}>
        <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 4 }}>
          <Text style={theme.infoFooterText}>
            Module hardware developed and maintained by
          </Text>

          <Pressable
            onPress={() => openGithub("module")}
          >
            {
              ({ pressed }) => <Text style={[theme.infoFooterText, {
                color: "#99c3ff",
                textDecorationLine: pressed ? "underline" : "none"
              }]}>
                @pyroxenes
              </Text>
            }

          </Pressable>
        </View>

        <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 4 }}>
          <Text style={theme.infoFooterText}>

            Module software developed and maintained by
          </Text>
          <Pressable
            onPress={() => openGithub("software")}
          >
            {
              ({ pressed }) => <Text style={[theme.infoFooterText, {
                color: "#99c3ff",
                textDecorationLine: pressed ? "underline" : "none"
              }]}>
                @seasaltsaige
              </Text>
            }

          </Pressable>
        </View>
      </View>

    </View>
  )
}