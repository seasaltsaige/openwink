import { useCallback, useEffect, useReducer, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import RangeSlider from "react-native-sticky-range-slider";

import { TooltipHeader, HeaderWithBackButton, MiataHeadlights, SettingsToolbar } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import { sleep } from "../../../helper/Functions";
import { cancelAnimation, Easing, runOnJS, useAnimatedReaction, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";

const MIN = 0;
const MAX = 100;


export function WaveDelaySettings() {

  const { colorTheme, theme } = useColorTheme();

  const { updateWaveDelayMulti } = useBleCommand();
  const {
    waveDelayMulti,
    leftMoveTime,
    rightMoveTime
  } = useBleMonitor();

  const {
    isConnected
  } = useBleConnection();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [min, setMin] = useState(MIN);
  const [max, setMax] = useState(MAX);

  const handleValueChange = useCallback((newLow: number, newHigh: number) => {
    console.log(newLow, newHigh);
    setMin(newLow);
    setMax(newHigh);
  }, []);

  useEffect(() => {
    if (waveDelayMulti * 100 !== MIN)
      setMin(parseFloat((waveDelayMulti * 100).toPrecision(2)));
  }, []);

  useEffect(() => {
    setMin(waveDelayMulti * 100);
  }, [waveDelayMulti])

  const leftWaveStatus = useSharedValue(100);
  const rightWaveStatus = useSharedValue(100);

  const [leftWave, setLeftWave] = useState(leftWaveStatus.value);
  const [rightWave, setRightWave] = useState(rightWaveStatus.value);
  const [animationRunning, setAnimationRunning] = useState(false);

  const animateWave = useCallback(() => {
    setAnimationRunning(true);

    cancelAnimation(leftWaveStatus);
    cancelAnimation(rightWaveStatus);

    leftWaveStatus.value = withSequence(
      withTiming(0, { duration: leftMoveTime, easing: Easing.linear }),
      withTiming(100, { duration: leftMoveTime, easing: Easing.linear }),
    );

    rightWaveStatus.value = withDelay(
      leftMoveTime * (min / 100),
      withSequence(
        withTiming(0, { duration: rightMoveTime, easing: Easing.linear }),
        withTiming(100, { duration: rightMoveTime, easing: Easing.linear }),
      )
    );
  }, [min]);

  useAnimatedReaction(
    () => leftWaveStatus.value,
    (value) => runOnJS(setLeftWave)(value),
  );
  useAnimatedReaction(
    () => rightWaveStatus.value,
    (value) => runOnJS(setRightWave)(value),
  );

  useEffect(() => {
    if (rightWave === 100) setAnimationRunning(false);
  }, [rightWave]);


  return (
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={backHumanReadable}
        headerText="Waves"
        deviceStatus
      />

      <TooltipHeader
        tooltipContent={
          <Text style={theme.tooltipContainerText}>
            Delay between when each headlight actuates in a wave animation. At 100% the animation waits for the first headlight to move completely before activating the second one. At 0%, it does not wait. (Acting similar to a “blink”)
          </Text>
        }
        tooltipTitle="Delay Percentage"
      />

      <View
        style={{
          rowGap: 3,
          marginBottom: 8,
        }}
      >
        <MiataHeadlights
          leftStatus={leftWave / 100}
          rightStatus={rightWave / 100}
        />

        <Pressable
          hitSlop={10}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 8
          }}
          disabled={(!isConnected || animationRunning)}
          onPress={() => animateWave()}
        >
          {({ pressed }) => (
            <>
              <Text
                style={{
                  color: (!isConnected || animationRunning) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  fontFamily: "IBMPlexSans_500Medium",
                  textDecorationColor: !isConnected ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  fontSize: 18,
                }}>
                Test Delay
              </Text>

              <IonIcons style={{ marginTop: 5 }} size={20} name="play" color={(!isConnected || animationRunning) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
            </>
          )}
        </Pressable>

      </View>

      <RangeSlider
        style={theme.rangeSliderStyle}
        min={MIN}
        max={MAX}
        step={1}
        low={min}
        high={max}
        onValueChanged={handleValueChange}
        renderLowValue={(value) => (
          <Text style={theme.rangeSliderLowText}>
            {value}%
          </Text>
        )}
        renderThumb={() => <View style={(!isConnected || animationRunning) ? theme.rangeSliderThumbDisabled : theme.rangeSliderThumb} />}
        renderRailSelected={() => <View style={(!isConnected || animationRunning) ? theme.rangeSliderRailSelectedDisabled : theme.rangeSliderRailSelected} />}
        renderRail={() => <View style={theme.rangeSliderRail} />}
        disableRange
        disabled={!isConnected || animationRunning}
      />


      <View style={theme.rangeSliderSubtextView}>
        <Text style={theme.rangeSliderSubtext}>Faster</Text>
        <Text style={theme.rangeSliderSubtext}>Slower</Text>
      </View>


      <TooltipHeader
        tooltipContent={
          <Text style={theme.tooltipContainerText}>
            Choose from pre-defined quick presets.{"\n"}Fast = 25%{"\n"}Medium = 50%{"\n"}Slow = 75%{"\n"}Slowest = 100%
          </Text>
        }
        tooltipTitle="Delay Presets"
      />

      <View style={{ display: "flex", flexDirection: "row", columnGap: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "center", rowGap: 10, }}>
        {
          [
            { value: 0.25, name: "Fast", icon: "flash-outline" },
            { value: 0.5, name: "Medium", icon: "speedometer-outline" },
            { value: 0.75, name: "Slow", icon: "hourglass-outline" },
            { value: 1.0, name: "Slowest", icon: "time-outline" },
          ].map((obj, key) => (
            <Pressable
              style={({ pressed }) => !isConnected ? theme.rangeSliderButtonsDisabled : (
                obj.value === min / 100 ?
                  theme.rangeSliderButtonsPressed
                  :
                  pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons
              )}
              key={key}
              disabled={!isConnected}
              onPress={() => setMin(obj.value * 100)}
            >
              <Text style={theme.rangeSliderButtonsText}>
                {obj.name}
              </Text>
              <IonIcons size={20} name={obj.icon as any} color={colorTheme.textColor} />
            </Pressable>
          ))
        }
      </View>


      <SettingsToolbar
        disabled={!isConnected}
        reset={() => updateWaveDelayMulti(1.0)}
        save={() => updateWaveDelayMulti(min / 100)}
        resetText="Reset Delay"
        saveText="Save Delay"
      />

    </SafeAreaView>
  )

}