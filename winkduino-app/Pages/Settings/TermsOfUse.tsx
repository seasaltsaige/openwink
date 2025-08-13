import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";

export function TermsOfUse() {

  const { colorTheme, theme } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

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
                <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>{back}</Text>
              </>
            )}
        </Pressable>
        <Text style={theme.settingsHeaderText}>
          Terms Of Use
        </Text>
      </View>

      <ScrollView contentContainerStyle={theme.contentContainer}>

      </ScrollView>

    </View>
  )
}