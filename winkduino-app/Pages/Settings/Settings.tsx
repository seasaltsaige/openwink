import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native"
import { useColorTheme } from "../../hooks/useColorTheme";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LongButton } from "../../Components/LongButton";

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
              <LongButton
                //@ts-ignore
                onPress={() => navigate.navigate(c.navigationName, { back: route.name })}
                icons={{
                  names: [c.pageSymbol as any, "chevron-forward-outline"],
                  size: [25, 20],
                }}
                text={c.pageName}
                key={c.pageName}
              />
            ))
          }

        </View>


        {/* TODO: Credits footer */}

      </View >
    </>
  );
}