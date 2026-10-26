import { ScrollView, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { useColorTheme } from "../../hooks/useColorTheme";
import { AboutFooter, HeaderWithBackButton } from "../../Components";

export function TermsOfUse() {

  const { theme } = useColorTheme();

  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <View style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="Terms of Use"
      />

      <ScrollView contentContainerStyle={theme.contentContainer}>




      </ScrollView>

      <AboutFooter />
    </View>
  )
}