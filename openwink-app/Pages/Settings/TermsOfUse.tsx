import { ScrollView } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HeaderWithBackButton } from "../../Components";
import { SafeAreaView } from "react-native-safe-area-context";

export function TermsOfUse() {

  const { theme } = useColorTheme();

  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="Terms of Use"
      />

      <ScrollView contentContainerStyle={theme.contentContainer}>

      </ScrollView>

    </SafeAreaView>
  )
}