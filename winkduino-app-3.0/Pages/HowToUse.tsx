import { useTheme } from "@react-navigation/native";
import { SafeAreaView, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";

export function HowToUse() {

  const { theme } = useColorTheme();

  return (
    <View style={theme.container}>
      <View style={theme.headerContainer}>
        <Text style={theme.headerText}>Help</Text>
      </View>
    </View>
  );
}