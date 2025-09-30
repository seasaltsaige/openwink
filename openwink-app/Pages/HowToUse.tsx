import { SafeAreaView } from "react-native"

import { useColorTheme } from "../hooks/useColorTheme";
import { MainHeader } from "../Components";

export function HowToUse() {

  const { theme } = useColorTheme();

  return (
    <SafeAreaView style={theme.tabContainer}>
      <MainHeader text="Help" />
    </SafeAreaView>
  );
}