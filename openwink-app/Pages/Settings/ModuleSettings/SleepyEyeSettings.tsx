import { useReducer } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import VerticalSlider from "rn-vertical-slider-matyno";

import { TooltipHeader, HeaderWithBackButton } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";

export function SleepyEyeSettings() {

  const { colorTheme, theme } = useColorTheme();

  const {
    isConnected
  } = useBleConnection();

  const {
    leftStatus,
    rightStatus,
  } = useBleMonitor();

  const {
    leftSleepyEye,
    rightSleepyEye,
    setSleepyEyeValues
  } = useBleCommand();

  const route = useRoute();
  //@ts-ignore
  const { backHumanReadable } = route.params;

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
    (!isConnected || ((leftStatus !== 1 && leftStatus !== 0) || (rightStatus !== 1 && rightStatus !== 0)));

  return (
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={backHumanReadable}
        headerText="Sleepy"
        deviceStatus
      />

      <TooltipHeader
        tooltipContent={
          <Text style={theme.tooltipContainerText}>
            Position of the headlights when module is in Sleepy Eye Mode, based from the headlight lowered state.{"\n"}
            25% = ~25% raised{"\n"}
            75% = ~75% raised
          </Text>
        }
        tooltipTitle="Headlight Position"
      />

      <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%", height: "auto" }}>

        {
          (["left", "right"] as const).map(side => (
            <View key={side} style={{ rowGap: 5, width: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", }}>
              <View style={{ position: "relative", width: "auto", height: "auto", alignItems: "center" }}>
                <IonIcons style={{ position: "absolute", top: 3, zIndex: 2 }} name={"add-outline"} size={22} color={colorTheme.headerTextColor} />
                <VerticalSlider
                  value={headlightPosition[side]}
                  max={100}
                  min={0}
                  width={38}
                  height={125}
                  onChange={(val) => dispatchHeadlightPosition({ side, percentage: val })}
                  step={1}
                  borderRadius={9}
                  minimumTrackTintColor={disabledStatus ? `${colorTheme.buttonColor}80` : `${colorTheme.buttonColor}CC`}
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


      <TooltipHeader
        tooltipContent={
          <Text style={theme.tooltipContainerText}>
            Quick presets for each headlight side when{"\n"}Sleepy Eye Mode is active.{"\n"}
            High = 75%{"\n"}
            Middle = 50%{"\n"}
            Low = 25%
          </Text>
        }
        tooltipTitle="Quick Presets"
      />


      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        width: "100%",
      }}>

        {
          (["left_preset", "right_preset"] as const).map((preset) => (
            <View key={preset} style={{ display: "flex", flexDirection: "column", alignContent: "center", justifyContent: "flex-start", rowGap: 10, width: "43%" }}>
              <Text style={{
                fontFamily: "IBMPlexSans_500Medium",
                fontSize: 18,
                color: colorTheme.headerTextColor,
                textAlign: "center",
              }}>
                {preset === "left_preset" ? "Left Headlight" : "Right Headlight"}
              </Text>

              {
                [{ type: "High", value: 75 }, { type: "Middle", value: 50 }, { type: "Low", value: 25 }].map(quickButton => (
                  <Pressable
                    style={({ pressed }) => [
                      disabledStatus ?
                        theme.rangeSliderButtonsDisabled :
                        (pressed || (headlightPosition[(preset === "left_preset" ? "left" : "right")] === quickButton.value)) ?
                          theme.rangeSliderButtonsPressed :
                          theme.rangeSliderButtons,
                      { alignContent: "center", justifyContent: "center" }
                    ]}
                    disabled={disabledStatus}
                    key={quickButton.type}
                    onPress={() => { dispatchHeadlightPosition({ side: preset === "left_preset" ? "left" : "right", percentage: quickButton.value }); setSleepyEyeValues(preset === "left_preset" ? quickButton.value : headlightPosition.left, preset === "right_preset" ? quickButton.value : headlightPosition.right) }}
                  >
                    <Text style={theme.rangeSliderButtonsText}>
                      {quickButton.type}
                    </Text>
                  </Pressable>
                ))
              }
            </View>
          ))
        }

      </View>

    </SafeAreaView>
  )

}