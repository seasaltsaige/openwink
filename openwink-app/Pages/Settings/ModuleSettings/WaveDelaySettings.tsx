import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import RangeSlider from "react-native-sticky-range-slider";

import { TooltipHeader, HeaderWithBackButton } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";

const MIN = 0;
const MAX = 100;


export function WaveDelaySettings() {

  const { colorTheme, theme } = useColorTheme();

  const { updateWaveDelayMulti } = useBleCommand();
  const { waveDelayMulti } = useBleMonitor();
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
        renderThumb={() => <View style={!isConnected ? theme.rangeSliderThumbDisabled : theme.rangeSliderThumb} />}
        renderRailSelected={() => <View style={!isConnected ? theme.rangeSliderRailSelectedDisabled : theme.rangeSliderRailSelected} />}
        renderRail={() => <View style={theme.rangeSliderRail} />}
        disableRange
        disabled={!isConnected}
      />


      <View style={theme.rangeSliderSubtextView}>
        <Text style={theme.rangeSliderSubtext}>Faster</Text>
        <Text style={theme.rangeSliderSubtext}>Slower</Text>
      </View>


      <View style={theme.rangeSliderButtonsView}>
        <Pressable
          style={({ pressed }) => !isConnected ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
          disabled={!isConnected}
          onPress={() => updateWaveDelayMulti(1.0)}
        >
          <Text style={theme.rangeSliderButtonsText}>
            Reset Delay
          </Text>
          <IonIcons size={22} name="reload-outline" color={colorTheme.textColor} />
        </Pressable>


        <Pressable
          style={({ pressed }) => !isConnected ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
          disabled={!isConnected}
          onPress={() => updateWaveDelayMulti(min / 100)}
        >
          <Text style={theme.rangeSliderButtonsText}>
            Save Delay
          </Text>
          <IonIcons size={22} name="download-outline" color={colorTheme.textColor} />
        </Pressable>
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
              onPress={() => updateWaveDelayMulti(obj.value)}
            >
              <Text style={theme.rangeSliderButtonsText}>
                {obj.name}
              </Text>
              <IonIcons size={20} name={obj.icon as any} color={colorTheme.textColor} />
            </Pressable>
          ))
        }
      </View>
    </SafeAreaView>
  )

}