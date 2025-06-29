import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import RangeSlider from "react-native-sticky-range-slider";
import Tooltip from "react-native-walkthrough-tooltip";
const MIN = 0;
const MAX = 100;


export function WaveDelaySettings() {

  const { colorTheme } = useColorTheme();

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
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 25,
      }}
    >

      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>

        <Pressable style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 10,
          height: "100%"
        }}
          onPress={() => navigation.goBack()}
        >
          {
            ({ pressed }) => (
              <>
                <IonIcons name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                <Text style={{
                  color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  fontWeight: "500",
                  fontSize: 20
                }}>{backHumanReadable}</Text>


                {
                  device ? (
                    <IonIcons name="wifi-outline" color="#367024" size={21} />
                  ) : (
                    isConnecting || isScanning ?
                      <ActivityIndicator color={colorTheme.buttonColor} />
                      : (
                        <IonIcons name="cloud-offline-outline" color="#b3b3b3" size={23} />
                      )
                  )
                }
              </>
            )
          }
        </Pressable>


        <Text style={{
          fontSize: 25,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        }}
        >Wave Delay</Text>

      </View>

      <View
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
          rowGap: 10,
        }}
      >
        {/* 
        <Text>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Earum assumenda reiciendis a quo placeat officiis accusantium autem explicabo, consequuntur dolorum eaque aliquid, qui error harum aliquam cum magni veniam rem!</Text> */}

        <Tooltip
          isVisible={delayMultiTooltipVisible}
          closeOnBackgroundInteraction
          closeOnContentInteraction
          placement="bottom"
          onClose={() => setDelayMultiTooltipVisible(false)}
          contentStyle={{
            backgroundColor: colorTheme.backgroundSecondaryColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "auto",
            width: "auto",
            borderRadius: 7,
            // marginTop: 10
          }}
          content={
            <Text style={{
              color: colorTheme.textColor,
              textAlign: "center",
              fontWeight: "500",
              padding: 5,
            }}>
              Delay between when each headlight actuates in a wave animation. At 100% the animation waits for the first headlight to move completely before activating the second one, and at 0%, it does not wait. {"\n"}(Acting similar to 'blink')
            </Text>
          }
        >

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              columnGap: 10,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "600",
                fontSize: 22,
              }}
            >
              Delay Percentage
            </Text>
            <Pressable
              hitSlop={20}
              onPress={() => setDelayMultiTooltipVisible(true)}
            >
              {
                ({ pressed }) => (
                  <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
                )
              }
            </Pressable>
          </View>
        </Tooltip>



        <RangeSlider
          style={{ width: "80%", height: 10, marginTop: 10, }}
          min={MIN}
          max={MAX}
          step={1}
          // minRange={5}
          low={min}
          high={max}
          onValueChanged={handleValueChange}
          renderLowValue={(value) => <Text style={{ color: colorTheme.headerTextColor, fontWeight: "bold", fontSize: 15, width: 50, }}>{value}%</Text>}
          renderThumb={() => <View
            style={{ width: 25, height: 25, borderRadius: 15, borderWidth: 1, borderColor: "white", backgroundColor: !device ? colorTheme.disabledButtonColor : colorTheme.buttonColor }}
          />}

          renderRailSelected={() => <View
            style={{ height: 5, borderRadius: 3, backgroundColor: !device ? colorTheme.disabledButtonColor : colorTheme.buttonColor }}
          />
          }
          renderRail={() => <View
            style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: colorTheme.disabledButtonColor }}
          />
          }
          disableRange
          disabled={!device}
        />

      </View>

      <View style={{ width: "85%", marginTop: -5, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 15, fontWeight: "bold", color: colorTheme.headerTextColor }}>Faster</Text>
        <Text style={{ fontSize: 15, fontWeight: "bold", color: colorTheme.headerTextColor }}>Slower</Text>
      </View>


      <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%" }}>
        <Pressable
          style={({ pressed }) => (
            {
              backgroundColor: !device ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "40%",
              padding: 5,
              paddingVertical: 10,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
              paddingHorizontal: 15,
              paddingRight: 10
            }
          )}
          disabled={!device}
          onPress={() => updateWaveDelayMulti(1.0)}
        >
          <Text
            style={{
              color: colorTheme.buttonTextColor,
              fontSize: 17,
              fontWeight: 500,
            }}
          >
            Reset Delay
          </Text>
          <IonIcons size={22} name="reload-outline" color={colorTheme.buttonTextColor} />
        </Pressable>


        <Pressable
          style={({ pressed }) => (
            {
              backgroundColor: !device ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "40%",
              padding: 5,
              paddingVertical: 10,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
              paddingHorizontal: 15,
              paddingRight: 10
            }
          )}
          disabled={!device}
          onPress={() => updateWaveDelayMulti(min / 100)}
        >
          <Text
            style={{
              color: colorTheme.buttonTextColor,
              fontSize: 17,
              fontWeight: 500,
            }}
          >
            Save Delay
          </Text>
          <IonIcons size={22} name="download-outline" color={colorTheme.buttonTextColor} />
        </Pressable>
      </View>


      <View style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", rowGap: 8 }} >

        <Tooltip
          isVisible={delayPresetTooltipVisible}
          closeOnBackgroundInteraction
          closeOnContentInteraction
          placement="bottom"
          onClose={() => setDelayPresetTooltipVisible(false)}
          contentStyle={{
            backgroundColor: colorTheme.backgroundSecondaryColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "auto",
            width: "auto",
            borderRadius: 7,
            // marginTop: 10
          }}
          content={
            <Text style={{
              color: colorTheme.textColor,
              textAlign: "center",
              fontWeight: "500",
              padding: 5,
            }}>
              Choose from pre-defined quick presets.{"\n"}Fast: 25%{"\n"}Medium: 50%{"\n"}Slow: 75%{"\n"}Slowest: 100%
            </Text>
          }
        >

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              columnGap: 10,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "600",
                fontSize: 22,
              }}
            >
              Delay Presets
            </Text>
            <Pressable
              hitSlop={20}
              onPress={() => setDelayPresetTooltipVisible(true)}
            >
              {
                ({ pressed }) => (
                  <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
                )
              }
            </Pressable>
          </View>
        </Tooltip>

        <View style={{ display: "flex", flexDirection: "row", columnGap: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "center", rowGap: 10, }}>
          {
            [
              { value: 0.25, name: "Fast", icon: "flash-outline" },
              { value: 0.5, name: "Medium", icon: "speedometer-outline" },
              { value: 0.75, name: "Slow", icon: "hourglass-outline" },
              { value: 1.0, name: "Slowest", icon: "time-outline" },
            ].map((obj, key) => (
              <Pressable
                style={({ pressed }) => (
                  {
                    backgroundColor: !device ? colorTheme.disabledButtonColor : (
                      obj.value === min / 100 ?
                        colorTheme.buttonColor
                        :
                        pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor
                    ),
                    // width: "40%",
                    padding: 5,
                    paddingVertical: 10,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 8,
                    paddingHorizontal: 15,
                    paddingRight: 10,
                    columnGap: 8,
                  }
                )}
                key={key}
                disabled={!device}
                onPress={() => updateWaveDelayMulti(obj.value)}
              >
                <Text
                  style={{
                    color: colorTheme.buttonTextColor,
                    fontSize: 17,
                    fontWeight: 500,
                  }}
                >
                  {obj.name}
                </Text>
                <IonIcons size={22} name={obj.icon as any} color={colorTheme.buttonTextColor} />
              </Pressable>
            ))
          }
        </View>

      </View>


      <View
        style={{
          width: "85%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          backgroundColor: accordionOpen ? colorTheme.dropdownColor : colorTheme.backgroundPrimaryColor,
          paddingBottom: accordionOpen ? 10 : 0,
          borderRadius: 8,
        }}
      >

        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
          })}
          //@ts-ignore
          onPress={() => setAccordionOpen(!accordionOpen)}
          key={6}>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 10,
              marginLeft: 10,
            }}
          >

            <IonIcons
              name="flask-outline"
              size={25}
              color={colorTheme.headerTextColor}

            />
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 17,
              }}
            >Fine Control</Text>
          </View>
          <IonIcons style={{ marginRight: 10 }} name={accordionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color={colorTheme.headerTextColor} />
        </Pressable>

        {
          accordionOpen ? (
            <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }}>
              <TextInput
                style={{
                  backgroundColor: colorTheme.backgroundPrimaryColor,
                  borderColor: colorTheme.backgroundSecondaryColor,
                  borderWidth: 2,
                  borderRadius: 4,
                  height: 40,
                  width: "40%",
                  color: colorTheme.textColor,
                  fontWeight: "400",
                  fontSize: 16
                  // textAlign: "center",

                }}
                textAlign="center"
                placeholderTextColor={colorTheme.textColor}
                placeholder="Enter percentage"
                value={fineControlValue}
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
                style={({ pressed }) => (
                  {
                    backgroundColor: !device ? colorTheme.disabledButtonColor :
                      pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                    paddingVertical: 6,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingRight: 10,
                    columnGap: 8,
                  }
                )}
                disabled={!device}
                onPress={() => { updateWaveDelayMulti(parseFloat(fineControlValue) / 100); setFineControlValue("") }}
              >
                <Text
                  style={{
                    color: colorTheme.buttonTextColor,
                    fontSize: 17,
                    fontWeight: 500,
                  }}
                >
                  Set Value
                </Text>
                <IonIcons size={22} name={"arrow-forward-outline"} color={colorTheme.buttonTextColor} />
              </Pressable>
            </View>
          ) : <></>
        }

      </View>


    </View>
  )

}