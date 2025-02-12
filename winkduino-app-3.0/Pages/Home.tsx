import { useTheme } from "@react-navigation/native";
import { SafeAreaView, StatusBar, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";

export function Home() {

  const { colorTheme } = useColorTheme();


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
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >

        <Text
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: colorTheme.headerTextColor,
            width: "100%",
          }}
        >Home</Text>

      </View>

      <View>
        <Text>
          {
            "No device connected"
          }
        </Text>
      </View>

    </View>

  );
}