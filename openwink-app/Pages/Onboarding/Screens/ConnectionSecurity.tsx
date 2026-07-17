import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";

export function ConnectionSecurity() {

  const { colorTheme } = useColorTheme();

  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>

      <View style={{ flex: 1 }} />


      <Text style={{
        fontFamily: "IBMPlexSans_700Bold",
        textAlign: "right",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        marginTop: 20,
      }}>
        Exclusively Yours
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "right",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        OpenWink pairs with your phone upon first connection, only allowing
        <Text style={{ fontFamily: "IBMPlexSans_700Bold" }}>
          {" "}your{" "}
        </Text>
        device to activate commands remotely, ensuring your headlight system is completely secured.
      </Text>

    </View>
  )
}