import { SafeAreaView, View } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native";

import { useColorTheme } from "../../hooks/useColorTheme";
import { AboutFooter, LongButton, MainHeader } from "../../Components";
import { SETTINGS_DATA } from "../../helper/Constants";

export function Settings() {

  const { theme } = useColorTheme();

  const navigate = useNavigation();
  const route = useRoute();

  return (
    <SafeAreaView style={theme.tabContainer}>
      <MainHeader text="Settings" />

      <View style={theme.homeScreenButtonsContainer}>

        {
          SETTINGS_DATA.map((c, i) => (
            <LongButton
              //@ts-ignore
              onPress={() => navigate.navigate(c.navigationName, { back: route.name })}
              icons={{
                names: [c.pageSymbol as any, "chevron-forward-outline"],
                size: [25, 20],
              }}
              text={c.pageName}
              key={c.pageName}
            />
          ))
        }

        {/* Developer Settings - only visible in development mode */}
        {__DEV__ && (
          <LongButton
            //@ts-ignore
            onPress={() => navigate.navigate("DeveloperSettings", { back: route.name })}
            icons={{
              names: ["code-slash-outline" as any, "chevron-forward-outline"],
              size: [25, 20],
            }}
            text="Developer Settings"
          />
        )}

      </View>


      <AboutFooter />

    </SafeAreaView>
  );
}