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

  const popupHeight = useSharedValue(50);

  const open = () => {
    setPopupOpen(true);
    popupHeight.value = withSequence(
      withTiming(100, { duration: ANIMATION_DURATION_MS, easing: ANIMATION_STYLE })
    );
  }

  const close = () => {
    popupHeight.value = withSequence(
      withTiming(50, { duration: ANIMATION_DURATION_MS, easing: ANIMATION_STYLE }),
    );
    setTimeout(() => {
      setPopupOpen(false);
    }, ANIMATION_DURATION_MS);
  }

  const animatedViewStyles = useAnimatedStyle(() => {
    return {
      height: popupHeight.value,
    }
  });

  const { theme, colorTheme } = useColorTheme();
  return (
    <>
      <Animated.View
        style={[
          theme.infoFooterContainer,
          { flexDirection: "column", rowGap: 5 },
          animatedViewStyles,
        ]}>


        <Pressable
          hitSlop={10}
          onPress={() => popupOpen ? close() : open()}
        >
          {({ pressed }) => (
            <IonIcons size={25} color={`${pressed ? colorTheme.buttonColor : colorTheme.headerTextColor}99`} name={popupOpen ? "chevron-collapse-outline" : "chevron-expand-outline"} />
          )}
        </Pressable>

        {popupOpen ?
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

      </Animated.View>
    </>
  )

}