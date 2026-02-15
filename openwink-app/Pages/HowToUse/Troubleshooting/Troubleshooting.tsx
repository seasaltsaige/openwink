import { Text, View } from "react-native";
import { TroubleshootingModules } from "./Modules";


export function Troubleshooting() {
  return (
    <View style={{
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      rowGap: 14,
    }}>
      {
        TroubleshootingModules.map(({ Component, name }) => (
          <Component key={name} />
        ))
      }
    </View>
  )
}