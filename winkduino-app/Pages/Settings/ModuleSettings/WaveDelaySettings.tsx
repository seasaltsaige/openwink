import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import RangeSlider from "react-native-sticky-range-slider";
import Tooltip from "react-native-walkthrough-tooltip";
import { HeaderWithBackButton } from "../../../Components/HeaderWithBackButton";
import { TooltipHeader } from "../../../Components";
const MIN = 0;
const MAX = 100;


export function WaveDelaySettings() {

  const { colorTheme, theme } = useColorTheme();

  const { waveDelayMulti, device, isScanning, isConnecting, updateWaveDelayMulti } = useBLE();

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

  const [delayMultiTooltipVisible, setDelayMultiTooltipVisible] = useState(false);
  const [delayPresetTooltipVisible, setDelayPresetTooltipVisible] = useState(false);

  const [accordionOpen, setAccordionOpen] = useState(false);

  const [fineControlValue, setFineControlValue] = useState("");

  useEffect(() => {
    if (waveDelayMulti * 100 !== MIN)
      setMin(parseFloat((waveDelayMulti * 100).toPrecision(2)));
  }, []);

  useEffect(() => {
    setMin(waveDelayMulti * 100);
  }, [waveDelayMulti])

  return (
    <View style={theme.container}>
      <HeaderWithBackButton
        backText={backHumanReadable}
        headerText="Waves"
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
        renderThumb={() => <View style={!device ? theme.rangeSliderThumbDisabled : theme.rangeSliderThumb} />}
        renderRailSelected={() => <View style={!device ? theme.rangeSliderRailSelectedDisabled : theme.rangeSliderRailSelected} />}
        renderRail={() => <View style={theme.rangeSliderRail} />}
        disableRange
        disabled={!device}
      />


      <View style={theme.rangeSliderSubtextView}>
        <Text style={theme.rangeSliderSubtext}>Faster</Text>
        <Text style={theme.rangeSliderSubtext}>Slower</Text>
      </View>


      <View style={theme.rangeSliderButtonsView}>
        <Pressable
          style={({ pressed }) => !device ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
          disabled={!device}
          onPress={() => updateWaveDelayMulti(1.0)}
        >
          <Text style={theme.rangeSliderButtonsText}>
            Reset Delay
          </Text>
          <IonIcons size={22} name="reload-outline" color={colorTheme.textColor} />
        </Pressable>


        <Pressable
          style={({ pressed }) => !device ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
          disabled={!device}
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
              style={({ pressed }) => !device ? theme.rangeSliderButtonsDisabled : (
                obj.value === min / 100 ?
                  theme.rangeSliderButtonsPressed
                  :
                  pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons
              )}
              key={key}
              disabled={!device}
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


      <View style={[theme.settingsDropdownContainer, { paddingBottom: accordionOpen ? 10 : 0 }]}>

        <Pressable
          style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
          onPress={() => setAccordionOpen(!accordionOpen)}
          key={6}
        >
          <View style={theme.mainLongButtonPressableView}>
            <IonIcons name="flask-outline" size={25} color={colorTheme.headerTextColor} />
            <Text style={theme.mainLongButtonPressableText}>
              Fine Control
            </Text>
          </View>
          <IonIcons style={theme.mainLongButtonPressableIcon} name={accordionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color={colorTheme.headerTextColor} />
        </Pressable>

        {
          accordionOpen ? (
            <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
              <TextInput
                style={[theme.waveTextEntry, { backgroundColor: !device ? colorTheme.disabledButtonColor : colorTheme.backgroundPrimaryColor }]}
                textAlign="center"
                placeholderTextColor={colorTheme.textColor}
                placeholder={!!device ? "Enter percentage" : "Connect to module"}
                value={fineControlValue}
                editable={!!device}
                onChangeText={(text) => {
                  const oldText = fineControlValue;
                  setFineControlValue(text);
                  if (text.length > 0) {
                    if (isNaN(parseFloat(text))) setFineControlValue(oldText);
                    if (parseFloat(text) > 100 || parseFloat(text) < 0) setFineControlValue(oldText);
                    if (text.length > 4) setFineControlValue(oldText)
                  }
                }}
              />
              <Pressable
                style={({ pressed }) => !device ? theme.modalSettingsConfirmationButtonDisabled :
                  pressed ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton}
                disabled={!device}
                onPress={() => { updateWaveDelayMulti(parseFloat(fineControlValue) / 100); setFineControlValue("") }}
              >
                <Text
                  style={[theme.modalSettingsConfirmationButtonText, { fontSize: 16 }]}
                >
                  Set Value
                </Text>
                <IonIcons size={22} name={"arrow-forward-outline"} color={colorTheme.textColor} />
              </Pressable>
            </View>
          ) : <></>
        }

      </View>


    </View>
  )

}