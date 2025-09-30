import { Text, View } from "react-native";

import { useColorTheme } from "../hooks/useColorTheme";

export function MainHeader({ text }: { text: string }) {
  const { theme } = useColorTheme();

  return (
    <View style={theme.headerContainer}>
      <Text style={theme.headerText}>
        {text}
      </Text>
    </View>
  )
}