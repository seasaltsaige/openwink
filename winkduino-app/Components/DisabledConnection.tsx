import { Text, View } from "react-native";
import { useBLE } from "../hooks/useBLE";
import { useColorTheme } from "../hooks/useColorTheme";



export default function DisabledConnection(props: { name: string }) {
  const { colorTheme } = useColorTheme();
  const { device } = useBLE();

  return (
    device ? <></> :
      <View
        style={{
          display: "flex",
          position: "absolute",
          width: "110%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
          zIndex: 1000,
          opacity: 0.2,
        }}
      >
        <View>
          <Text
            style={{
              color: colorTheme.textColor,
              fontWeight: "bold",
              fontSize: 15,
            }}
          >
            Please connect to your module to use the {props.name} settings.
          </Text>
        </View>
      </View>
  )
}