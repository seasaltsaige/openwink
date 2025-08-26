import { Linking, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";

export function AboutFooter({ }) {

  const openGithub = async (type: "module" | "software") => {
    if (type === "module")
      await Linking.openURL("https://github.com/pyroxenes/");
    else if (type === "software")
      await Linking.openURL("https://github.com/seasaltsaige/openwink");
  }

  const { theme, colorTheme } = useColorTheme();
  return (
    <View style={[
      theme.infoFooterContainer,
      { height: 60, flexDirection: "column", rowGap: 5 }
    ]}>
      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 4
      }}>
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

      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 4
      }}>
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
  )

}