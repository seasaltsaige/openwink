import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";

export function CustomWinkButton() {

  const { colorTheme } = useColorTheme();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [isBackPressed, setIsBackPressed] = useState(false);
  const backPressed = (bool: boolean) => setIsBackPressed(bool);

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
          fontSize: 30,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        }}
        >Customize Button</Text>

      </View>


      <ScrollView>

      </ScrollView>

    </View>
  )

}