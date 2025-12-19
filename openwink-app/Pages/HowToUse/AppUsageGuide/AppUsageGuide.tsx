import { View } from "react-native";
import { AppUsageModules } from "./Modules";

export function AppUsageGuide() {
  return (
    <View style={{
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      rowGap: 14,
    }}>
      {
        AppUsageModules.map(({ Component, name }) => (
          <Component key={name} />
        ))
      }
    </View>
  )
}



