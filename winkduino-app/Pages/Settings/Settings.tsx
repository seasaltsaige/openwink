import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native"
import { useColorTheme } from "../../hooks/useColorTheme";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

// ["App Info", "Module Info", "App Theme", "Module Customization", "Stored Data"]

const settingsData: Array<{
  pageName: string;
  pageSymbol: string;
  navigationName: string;
}> = [
    {
      pageName: "System Information",
      navigationName: "Info",
      pageSymbol: "information-circle-outline"
    },
    {
      pageName: "Module Settings",
      navigationName: "ModuleSettings",
      pageSymbol: "build-outline"
    },
    {
      pageName: "Application Theme",
      navigationName: "Theme",
      pageSymbol: "color-fill-outline"
    },
    {
      pageName: "System Terms Of Use",
      navigationName: "TermsOfUse",
      pageSymbol: "document-text-outline",
    }
  ]

export function Settings() {

  const { colorTheme, theme } = useColorTheme();

  const navigate = useNavigation();
  const route = useRoute();

  return (
    <>
      <View style={theme.container}>

        <View style={theme.headerContainer}>
          <Text style={theme.headerText}>
            Settings
          </Text>
        </View>

        <View style={theme.homeScreenButtonsContainer}>

          {
            settingsData.map((c, i) => (
              <Pressable
                style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
                //@ts-ignore
                onPress={() => navigate.navigate(c.navigationName, { back: route.name })}
                key={i}
              >
                <View style={theme.mainLongButtonPressableView}>
                  <Ionicons name={c.pageSymbol as any} size={25} color={colorTheme.headerTextColor} />
                  <Text style={theme.mainLongButtonPressableText}>
                    {c.pageName}
                  </Text>
                </View>
                <Ionicons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>
            ))
          }

        </View>


        {/* TODO: Credits footer */}

      </View >
    </>
  );
}