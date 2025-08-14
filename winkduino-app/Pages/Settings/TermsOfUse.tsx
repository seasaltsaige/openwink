import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { HeaderWithBackButton } from "../../Components";

export function TermsOfUse() {

  const { colorTheme, theme } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <View style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="Terms of Use"
      />

      <ScrollView contentContainerStyle={theme.contentContainer}>

      </ScrollView>

    </View>
  )
}