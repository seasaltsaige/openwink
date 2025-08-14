import { useTheme } from "@react-navigation/native";
import { SafeAreaView, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";
import { MainHeader } from "../Components";

export function HowToUse() {

  const { theme } = useColorTheme();

  return (
    <View style={theme.container}>
      <MainHeader text="Help" />
    </View>
  );
}