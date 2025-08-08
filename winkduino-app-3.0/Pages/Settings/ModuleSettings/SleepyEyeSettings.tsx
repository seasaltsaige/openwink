import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useMemo, useReducer, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import ToggleSwitch from "toggle-switch-react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import VerticalSlider from "rn-vertical-slider-matyno";
import RangeSlider from "react-native-sticky-range-slider";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

export function SleepyEyeSettings() {

  const { colorTheme, theme } = useColorTheme();
  const { device, leftStatus, rightStatus, isScanning, isConnecting, leftSleepyEye, rightSleepyEye, setSleepyEyeValues } = useBLE();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [headlightToolTipVisible, setHeadlightToolTipVisible] = useState(false);

  const [headlightPosition, dispatchHeadlightPosition] = useReducer((state: { left: number; right: number }, action: { side: "left" | "right"; percentage: number }) => {
    if (action.side === "left")
      return {
        ...state,
        left: action.percentage,
      }
    else
      return {
        ...state,
        right: action.percentage,
      }
  }, { left: leftSleepyEye, right: rightSleepyEye });

  const disabledStatus =
    (!device || ((leftStatus !== 1 && leftStatus !== 0) || (rightStatus !== 1 && rightStatus !== 0)));

  return (
    <View style={theme.container}>
      <View style={theme.headerContainer}>

        <Pressable
          style={theme.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          {
            ({ pressed }) => (
              <>
                <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                  {backHumanReadable}
                </Text>


                {
                  device ? (
                    <IonIcons style={theme.backButtonContainerIcon} name="wifi-outline" color="#367024" size={21} />
                  ) : (
                    isConnecting || isScanning ?
                      <ActivityIndicator style={theme.backButtonContainerIcon} color={colorTheme.buttonColor} />
                      : (
                        <IonIcons style={theme.backButtonContainerIcon} name="cloud-offline-outline" color="#b3b3b3" size={23} />
                      )
                  )
                }
              </>
            )
          }
        </Pressable>


        <Text style={theme.subSettingHeaderText}>
          Sleepy
        </Text>

      </View>



      <Tooltip
        isVisible={headlightToolTipVisible}
        closeOnBackgroundInteraction
        closeOnContentInteraction
        placement="bottom"
        onClose={() => setHeadlightToolTipVisible(false)}
        contentStyle={theme.tooltipContainer}
        content={
          <Text style={theme.tooltipContainerText}>

            Position of the headlights when module is in Sleepy Eye Mode, based from the headlight lowered state.{"\n"}
            25% = ~25% raised{"\n"}
            75% = ~75% raised

          </Text>
        }
      >

        <View style={theme.tooltipContainerView}>
          <Text
            style={theme.tooltipText}
          >
            Headlight Position
          </Text>
          <Pressable
            hitSlop={20}
            onPress={() => setHeadlightToolTipVisible(true)}
          >
            {
              ({ pressed }) => (
                <IonIcons style={theme.tooltipIcon} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
              )
            }
          </Pressable>
        </View>
      </Tooltip>

      <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%", height: "auto" }}>

        {
          (["left", "right"] as const).map(side => (
            <View key={side} style={{ /**rowGap: 30, marginTop: 15,**/ rowGap: 5, width: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", }}>
              <View style={{ position: "relative", width: "auto", height: "auto", alignItems: "center" }}>
                <IonIcons style={{ position: "absolute", top: 3, zIndex: 2 }} name={"add-outline"} size={22} color={colorTheme.headerTextColor} />
                <VerticalSlider
                  value={headlightPosition[side]}
                  max={100}
                  min={0}
                  width={33}
                  height={125}
                  onChange={(val) => dispatchHeadlightPosition({ side, percentage: val })}
                  step={1}
                  borderRadius={6}
                  // minimumTrackTintColor={disabledStatus ? `${colorTheme.buttonColor}80` : colorTheme.buttonColor}

                  minimumTrackTintColor={disabledStatus ? colorTheme.disabledButtonColor : `${colorTheme.backgroundSecondaryColor}FF`}
                  shadowProps={{
                    elevation: 4,


                  }}
                  disabled={disabledStatus}
                  maximumTrackTintColor={colorTheme.disabledButtonColor}
                />
                <IonIcons style={{ position: "absolute", bottom: 0 }} name={"remove-outline"} size={22} color={colorTheme.headerTextColor} />
              </View>

              <Text style={[theme.labelHeader, { width: "100%", fontFamily: "IBMPlexSans_500Medium", textAlign: "center", fontSize: 16 }]}>
                {side === "left" ? "Left" : "Right"}: {headlightPosition[side]}%
              </Text>

            </View>
          ))
        }

      </View>

      <View style={theme.rangeSliderButtonsView}>
        {/* RESET */}
        <Pressable
          style={({ pressed }) => disabledStatus ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
          disabled={disabledStatus}
          onPress={() => {
            setSleepyEyeValues(50, 50);
            dispatchHeadlightPosition({ side: "left", percentage: 50 });
            dispatchHeadlightPosition({ side: "right", percentage: 50 });
          }}
        // onPress={() => { updateButtonDelay(500); setMin(500); }}
        >
          <Text style={theme.rangeSliderButtonsText}>
            Reset Value
          </Text>
          <IonIcons size={22} name="reload-outline" color={colorTheme.textColor} />
        </Pressable>

        {/* SAVE */}
        <Pressable
          style={({ pressed }) => disabledStatus ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
          disabled={disabledStatus}
          onPress={() => setSleepyEyeValues(headlightPosition.left, headlightPosition.right)}
        // onPress={() => updateButtonDelay(min)}
        >
          <Text style={theme.rangeSliderButtonsText}>
            Save Value
          </Text>
          <IonIcons size={22} name="download-outline" color={colorTheme.textColor} />
        </Pressable>
      </View>
    </View>
  )

}