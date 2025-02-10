import { Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
export function AppTheme() {
  const { colorTheme } = useColorTheme();
  return (
    <View>
      <View>
        <IonIcons name="chevron-back-outline" color={colorTheme.headerTextColor} />
      </View>

      <Text>APP THEME</Text>
    </View>
  )
}