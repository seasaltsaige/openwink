import { Linking, Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useColorTheme } from "../hooks/useColorTheme";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useState } from "react";

const ANIMATION_STYLE = Easing.linear;
const ANIMATION_DURATION_MS = 150;

export function AboutFooter({ }) {

  const openGithub = async (type: "module" | "software") => {
    if (type === "module")
      await Linking.openURL("https://github.com/pyroxenes/");
    else if (type === "software")
      await Linking.openURL("https://github.com/seasaltsaige/openwink");
  }

  const [popupOpen, setPopupOpen] = useState(false);

  const open = () => {
    setPopupOpen(true);
  }

  const close = () => {
    setPopupOpen(false);
  }

  const { theme, colorTheme } = useColorTheme();
  return (
    <>
      <View
        style={[
          theme.infoFooterContainer,
          {
            flexDirection: "column",
            rowGap: 5,
            overflow: "hidden",
            position: "absolute",
            bottom: 15,
            height: "auto",
          },
        ]}>

        <Pressable
          hitSlop={10}
          onPress={() => popupOpen ? close() : open()}
        >
          {({ pressed }) => (
            <IonIcons
              size={25}
              color={`${pressed ? colorTheme.buttonColor : colorTheme.headerTextColor}99`}
              name={popupOpen ? "chevron-down" : "chevron-up"} />
          )}
        </Pressable>

        {
          popupOpen ?
            <>
              <View style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 4
              }}>
                <Text style={theme.infoFooterText}>
                  Module hardware developed and maintained by
                </Text>

                <Pressable
                  onPress={() => openGithub("module")}
                >
                  {
                    ({ pressed }) => <Text style={[theme.infoFooterText, {
                      color: "#99c3ff",
                      textDecorationLine: pressed ? "underline" : "none"
                    }]}>
                      @pyroxenes
                    </Text>
                  }

                </Pressable>
              </View>

              <View style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 4
              }}>
                <Text style={theme.infoFooterText}>

                  Module software developed and maintained by
                </Text>
                <Pressable
                  onPress={() => openGithub("software")}
                >
                  {
                    ({ pressed }) => <Text style={[theme.infoFooterText, {
                      color: "#99c3ff",
                      textDecorationLine: pressed ? "underline" : "none"
                    }]}>
                      @seasaltsaige
                    </Text>
                  }

                </Pressable>
              </View>
            </>
            : <></>
        }
      </View>
    </>
  )

}