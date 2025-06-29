import { Linking, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export function ModuleInfo() {

  const { colorTheme } = useColorTheme();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [isBackPressed, setIsBackPressed] = useState(false);
  const backPressed = (bool: boolean) => setIsBackPressed(bool);


  const openGithub = async (type: "module" | "software") => {
    if (type === "module")
      await Linking.openURL("https://github.com/pyroxenes");
    else if (type === "software")
      await Linking.openURL("https://github.com/seasaltsaige");
    // else alert("cant");
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
          fontSize: 30,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        }}
        >Module Info</Text>

      </View>




      <View
        style={{
          display: "flex",
          position: "absolute",
          bottom: 20,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          rowGap: 7,
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
          Module hardware developed and maintained by {
            <Pressable
              onPress={() => openGithub("module")}
            >
              {
                ({ pressed }) => <Text style={{
                  color: "#99c3ff",
                  textDecorationLine: pressed ? "underline" : "none"
                }}>
                  @pyroxenes
                </Text>
              }

            </Pressable>
          }
        </Text>

        <Text
          style={{
            color: colorTheme.textColor,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Module software developed and maintained by {
            <Pressable
              onPress={() => openGithub("software")}
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

    </View>
  )
}