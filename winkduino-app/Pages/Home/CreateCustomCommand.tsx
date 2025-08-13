import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useBLE } from "../../hooks/useBLE";
import { ActivityIndicator } from "react-native";

export function CreateCustomCommand() {
  const { theme, colorTheme } = useColorTheme();
  const { device, isConnecting, isScanning } = useBLE();
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
            (({ pressed }) => (
              <>

                <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                  {back}
                </Text>

                {
                  device ?
                    <IonIcons style={theme.backButtonContainerIcon} name="wifi-outline" color="#367024" size={23} /> :
                    (isConnecting || isScanning) ?
                      <ActivityIndicator style={theme.backButtonContainerIcon} color={colorTheme.buttonColor} /> :
                      <IonIcons style={theme.backButtonContainerIcon} name="cloud-offline-outline" color="#b3b3b3" size={23} />
                }

              </>
            ))
          }

        </Pressable>

        <View>
          <Text style={theme.settingsHeaderText}>
            Create Custom
          </Text>
        </View>
      </View>

      <View style={theme.contentContainer}>
      </View>
    </View>
  )
}