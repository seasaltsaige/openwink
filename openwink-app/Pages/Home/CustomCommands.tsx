import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useBLE } from "../../hooks/useBLE";
import { ActivityIndicator } from "react-native";
import { HeaderWithBackButton } from "../../Components";

export function CustomCommands() {
  const { theme, colorTheme } = useColorTheme();
  const { device, isConnecting, isScanning } = useBLE();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <View style={theme.container}>

      <HeaderWithBackButton
        backText={back}
        headerText="Run Custom"
        headerTextStyle={theme.settingsHeaderText}
      />

      <View style={theme.contentContainer}>
      </View>
    </View>
  )
}