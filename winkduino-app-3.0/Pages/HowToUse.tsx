import { useTheme } from "@react-navigation/native";
import { SafeAreaView, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";
import { NavigationBar } from "../Components/NavigationBar";

export function HowToUse() {

  const { colorTheme } = useColorTheme();

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
      }}
    >

      <NavigationBar />
    </View>
  );
}