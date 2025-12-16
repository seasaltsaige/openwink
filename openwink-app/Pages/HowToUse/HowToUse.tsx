import { SafeAreaView, View } from "react-native"

import { useColorTheme } from "../../hooks/useColorTheme";
import { MainHeader } from "../../Components";
import { InfoPageHeader } from "../../Components/InfoPageHeader";
import { ScrollView } from "react-native-gesture-handler";
import { AppUsageGuide } from "./AppUsageGuide/AppUsageGuide";
import { Troubleshooting } from "./Troubleshooting";
import { useState } from "react";
import { ModuleUsageGuide } from "./ModuleUsageGuide";

const pages = [
  "App Usage",
  "Module Usage",
  "Troubleshooting",
] as const;

export function HowToUse() {

  const { theme } = useColorTheme();
  const [selectedPage, setSelectedPage] = useState<typeof pages[number]>("App Usage");

  return (
    <SafeAreaView style={theme.tabContainer}>
      <MainHeader text="Help" />

      <InfoPageHeader
        onSelect={(cat) => setSelectedPage(cat)}
        categories={pages}
      />

      <View
        style={{
          width: "100%",
          flex: 1,
          marginBottom: 8,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            width: "100%",
          }}
        >
          {
            selectedPage === "App Usage" ? (
              <AppUsageGuide />
            ) : selectedPage === "Module Usage" ? (
              <ModuleUsageGuide />
            ) : selectedPage === "Troubleshooting" ? (
              <Troubleshooting />
            ) : <></>
          }
        </ScrollView>
      </View>


    </SafeAreaView>
  );
}