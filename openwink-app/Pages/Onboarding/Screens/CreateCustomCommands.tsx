import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";

import IonIcons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { DefaultCommandValueEnglish } from "../../../helper/Constants";
import LinearGradient from "react-native-linear-gradient";

export function CreateCustomCommands() {

  const { colorTheme } = useColorTheme();

  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>

      <View style={{ flex: 1 }} />

      <View
        style={{
          width: "100%",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 12,
          transform: [{ rotate: "-7deg" }, { scale: 0.925 }],
          marginBottom: 15,
        }}
      >
        {
          ["Left-Right", "Right-Left", "100 ms Delay", "Left Wave", "Right Wave"].map((item) => (
            <View
              key={item}
              style={{
                display: "flex",
                flexDirection: "row",
                width: 275,
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 2,
                paddingHorizontal: 10,
                borderStyle: "solid",
                borderColor: colorTheme.headerTextColor,
                backgroundColor: colorTheme.backgroundPrimaryColor,
                borderWidth: 1.75,
                borderRadius: 10,
                height: 48,
                opacity: 0.6

              }}
            >
              {/* Up down re-order button */}
              <View style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 15,
                paddingVertical: 3,
              }}>
                <MaterialIcons name="drag-indicator" size={23} color={colorTheme.headerTextColor} />

                <Text style={{
                  color: colorTheme.headerTextColor,
                  fontSize: 18,
                  fontFamily: "IBMPlexSans_500Medium"
                }}>
                  {
                    item
                  }
                </Text>
              </View>

              <IonIcons name="close" color={colorTheme.headerTextColor} size={24} />


            </View>
          ))
        }

        <View
          style={{
            display: "flex",
            width: 275,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 8,
            paddingHorizontal: 8,
            paddingLeft: 20,
            height: 48,
            borderStyle: "dashed",
            borderColor: colorTheme.headerTextColor,
            borderWidth: 1.75,
            borderRadius: 10,
            opacity: 0.6
          }}
          hitSlop={10}
          key={"custom-command-add"}
        >

          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 18,
              fontFamily: "IBMPlexSans_500Medium"
            }}
          >
            Add Component
          </Text>
          <IonIcons name="add" color={colorTheme.headerTextColor} size={28} />

        </View>


        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[colorTheme.backgroundPrimaryColor, "transparent"]}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "115%",
            width: "100%",
            zIndex: 1000,
            opacity: 1,
          }}
          pointerEvents="none"
        />

      </View>




      <Text style={{
        fontFamily: "IBMPlexSans_700Bold",
        textAlign: "left",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        marginTop: 20,
      }}>
        Build your own
        {/* <Text style={{ color: "#EFBF04", textShadowColor: "#EFBF04", textShadowOffset: 0, textShadowRadius: 10 }}> */}
        {" "}Sequences
        {/* </Text> */}
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "left",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Create personalized sequences and show off your own expressions with the custom command builder.
      </Text>

    </View>
  )
}