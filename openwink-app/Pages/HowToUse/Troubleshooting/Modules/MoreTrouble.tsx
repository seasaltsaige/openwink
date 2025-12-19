import { Linking, Pressable, Text, View } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
export function MoreTrouble() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      headerText="Still Having Trouble?"
      dropdown={
        <>
          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Still having trouble or your issue isn't mentioned here? Many problems are solved by a reset or restart of the module. If you still need more help, you can contact us for more help.
          </Text>


          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              flexWrap: "wrap",
              rowGap: 10,
            }}
          >

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
              }}
              onPress={() => {
                // TBA
              }}
            >
              {({ pressed }) => (
                <>
                  <Text
                    style={{
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 17,
                    }}
                  >
                    Contact Us
                  </Text>

                  <IonIcons
                    name="arrow-forward-outline"
                    size={18}
                    color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor}
                    style={{ marginTop: 4, }}
                  />
                </>
              )}
            </Pressable>

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
              }}
              onPress={() => Linking.openURL("https://github.com/seasaltsaige/openwink/issues/new")}
            >
              {({ pressed }) => (
                <>
                  <Text
                    style={{
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 17,
                    }}
                  >
                    Submit an Issue
                  </Text>

                  <IonIcons
                    name="arrow-forward-outline"
                    size={18}
                    color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor}
                    style={{ marginTop: 4, }}
                  />
                </>
              )}
            </Pressable>

          </View>

        </>
      }
      key={"more_trouble"}
    />
  )
}