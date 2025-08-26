import { useNavigation, useRoute } from "@react-navigation/native";
import { View } from "react-native"
import { useColorTheme } from "../../hooks/useColorTheme";
import { AboutFooter, LongButton } from "../../Components";
import { MainHeader } from "../../Components";
import { SETTINGS_DATA } from "../../helper/Constants";

export function Settings() {

  const { colorTheme, theme } = useColorTheme();

  const navigate = useNavigation();
  const route = useRoute();

  return (
    <>
      <View style={theme.container}>
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

        </View>


        <AboutFooter />

      </View >
    </>
  );
}