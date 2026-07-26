import { Modal, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import { Component, useReducer, useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { ONBOARDING_SCREENS } from "./Screens";
import { MilestoneProgressBar } from "../../Components/MilestoneProgressBar";

interface IOnboarding {
  visible: boolean;
  completeOnboarding: () => void;
}

enum PageUpdateType {
  NEXT_PAGE,
  PREV_PAGE,
  SET_PAGE,
}
interface PageUpdateState {
  index: number;
}

export function Onboarding({
  visible,
  completeOnboarding
}: IOnboarding) {
  const { colorTheme } = useColorTheme();

  function screenReducer(state: PageUpdateState, action: { type: PageUpdateType, payload?: number }) {
    if (action.type === PageUpdateType.NEXT_PAGE) {
      if (state.index === ONBOARDING_SCREENS.length - 1)
        return { index: ONBOARDING_SCREENS.length - 1 };
      else
        return { index: state.index + 1 };
    } else if (action.type === PageUpdateType.PREV_PAGE) {
      if (state.index === 0)
        return { index: 0 };
      else
        return { index: state.index - 1 };
    } else {
      return { index: action.payload || 0 };
    }
  }

  const [state, dispatchPageUpdate] = useReducer(screenReducer, { index: 0 });


  const CurrentScreen = ONBOARDING_SCREENS[state.index];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
    >
      <View style={{
        width: "100%",
        flex: 1,
        backgroundColor: colorTheme.backgroundPrimaryColor,
        paddingHorizontal: 15,
        paddingVertical: 20,
      }}>


        <MilestoneProgressBar
          barHeight={3}
          currentColor={colorTheme.headerTextColor}
          incompleteColor={`${colorTheme.headerTextColor}50`}
          currentIndex={state.index}
          itemCount={ONBOARDING_SCREENS.length}
          indexPressed={(index) => dispatchPageUpdate({ type: PageUpdateType.SET_PAGE, payload: index })}
        />

        <CurrentScreen />

        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}>


          <Pressable
            hitSlop={10}
            onPress={() => state.index !== ONBOARDING_SCREENS.length - 1 ? completeOnboarding() : {}}
          >
            {({ pressed }) => (
              <Text
                style={{
                  fontFamily: "IBMPlexSans_500Medium",
                  fontSize: 16,
                  color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  marginLeft: 20,
                }}
              >

                {
                  state.index !== ONBOARDING_SCREENS.length - 1 ? "Skip" : ""
                }
              </Text>
            )}
          </Pressable>


          <Pressable
            hitSlop={10}
            style={({ pressed }) => ({
              flexDirection: "row",
              columnGap: 5,
              alignItems: "center",
              padding: 15,
              borderRadius: 100,
              marginRight: 15,
              backgroundColor: pressed ? colorTheme.backgroundSecondaryColor : colorTheme.buttonColor,
            })}

            onPress={() => {
              if (state.index === ONBOARDING_SCREENS.length - 1)
                completeOnboarding();
              else
                dispatchPageUpdate({ type: PageUpdateType.NEXT_PAGE });
            }}
          >
            {({ pressed }) => (
              <IonIcons name={state.index === ONBOARDING_SCREENS.length - 1 ? "checkmark-done-outline" : "arrow-forward-outline"} color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={28} />
            )}
          </Pressable>


        </View>

      </View>
    </Modal>
  );
}