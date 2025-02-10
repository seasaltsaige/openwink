import { useTheme } from "@react-navigation/native";
import { SafeAreaView, StatusBar, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";

export function Home() {

  const { colorTheme } = useColorTheme();

  return (
    <>


      <View
        style={{
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
        }}
      >
        <Text style={{ color: colorTheme.headerTextColor, fontWeight: "bold", fontSize: 40 }}>HELLO WORLD</Text>
      </View>
    </>
  );
}