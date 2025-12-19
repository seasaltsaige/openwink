import { useCallback, useEffect, useReducer, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import VerticalSlider from "rn-vertical-slider-matyno";

import { TooltipHeader, HeaderWithBackButton, MiataHeadlights, SettingsToolbar } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Tooltip from "react-native-walkthrough-tooltip";

export function SleepyEyeSettings() {

  const { colorTheme, theme } = useColorTheme();

  const [coarseAdjust, setCoarseAdjust] = useState(false);

  const {
    isConnected
  } = useBleConnection();

  const {
    leftStatus,
    rightStatus,
    leftSleepyEye,
    rightSleepyEye,
    leftRightSwapped,
  } = useBleMonitor();

  const {
    setSleepyEyeValues,
  } = useBleCommand();

  const route = useRoute();
  //@ts-ignore
  const { backHumanReadable } = route.params;

  const disabledStatus =
    (!isConnected || ((leftStatus !== 1 && leftStatus !== 0) || (rightStatus !== 1 && rightStatus !== 0)));

  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);

  const [tutorialWalkthroughIndex, setTutorialWalkthroughIndex] = useState(-1);

  const [positionTooltipOpen, setPositionTooltipOpen] = useState(false);

  const [headlightPosition, dispatchHeadlightPosition] = useReducer((state: { left: number; right: number }, action: { side: "left" | "right"; percentage: number }) => {
    if (action.side === "left") {
      return {
        ...state,
        left: action.percentage,
      }
    } else {
      return {
        ...state,
        right: action.percentage,
      }
    }
  }, { left: leftSleepyEye, right: rightSleepyEye });

  const offset = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      if (disabledStatus) return;
      offset.value = 0;

      offset.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 550 }),
          withTiming(0, { duration: 550 }),
        ),
        2,
        false,
      );
    }, [disabledStatus])
  );


  const up = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));
  const down = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
  }));
  // TODO: Tap arrows adjust wrong side (due to swap)
  return (
    <SafeAreaView style={theme.container}>

      <HeaderWithBackButton
        backText={backHumanReadable}
        headerText="Sleepy"
        deviceStatus
      />

      <TooltipHeader
        parentControl={{
          setTooltipOpen: setPositionTooltipOpen,
          tooltipOpen: positionTooltipOpen,
        }}
        useModal={false}
        tooltipContent={
          <>
            <Text style={theme.tooltipContainerText}>
              Position of the headlights when module is in Sleepy Eye Mode, based from the headlight lowered state.{"\n"}
              25% = ~25% raised{"\n"}
              75% = ~75% raised
            </Text>

            <View
              style={{
                width: "100%",
                marginVertical: 3,
              }}
            >
              <Pressable
                style={{
                  padding: 5,
                }}
                hitSlop={15}
                onPress={() => {
                  setPositionTooltipOpen(false);
                  setTutorialWalkthroughIndex(0);
                }}
              >
                {({ pressed }) => (
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                      textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      textDecorationLine: "underline",
                      textDecorationStyle: "solid",
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    }}
                  >
                    View Tutorial
                  </Text>
                )}
              </Pressable>

            </View>
          </>
        }
        tooltipTitle="Headlight Position"
      />

      <View
        style={{
          width: "100%",
          alignItems: "center",
          rowGap: 5,
        }}
      >
        <View style={{
          width: "100%",
          flexDirection: "column",
          position: "relative",
        }}>

          <View
            style={{
              position: "absolute",
              left: 10,
              zIndex: 1,
            }}
            onTouchStart={() => setLeftActive(!disabledStatus && tutorialWalkthroughIndex === -1)}
            onTouchEnd={() => { setLeftActive(false); }}
          >
            <VerticalSlider
              value={leftRightSwapped ? headlightPosition["left"] : headlightPosition["right"]}
              max={100}
              min={0}
              step={coarseAdjust ? 15 : 1}
              ballIndicatorColor="orange"
              height={155}
              width={180}
              borderRadius={0}
              onChange={(value) => dispatchHeadlightPosition({ side: leftRightSwapped ? "left" : "right", percentage: value })}
              disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
              animationDuration={50}
              maximumTrackTintColor="#00000000"
              minimumTrackTintColor="#00000000"
              shadowProps={{
                shadowColor: "#00000000"
              }}
            />
          </View>

          <View
            style={{
              position: "absolute",
              zIndex: 2,
              left: 20,
              top: 0,
              height: "100%",
              width: 50,
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "column",
            }}
          >


            {/* Tutorial Second Item: Describes fine control with arrows (individual steps) */}
            <Tooltip
              isVisible={tutorialWalkthroughIndex === 1}
              contentStyle={[theme.tooltipContainer, {
                maxWidth: 210,
                width: "500%",
                height: "auto",
                zIndex: 200,
                boxShadow: [{
                  offsetX: 2,
                  offsetY: 2,
                  blurRadius: 5,
                  color: colorTheme.backgroundPrimaryColor,
                }]
              }]}
              content={
                <>
                  <Text
                    style={theme.tooltipContainerText}
                  >
                    To adjust headlight position with fine control, tap on the up and down arrows.
                  </Text>

                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingBottom: 6,
                      columnGap: 15,
                    }}
                  >
                    <Pressable
                      style={{
                        padding: 5,
                      }}
                      hitSlop={15}
                      onPress={() => {
                        setTutorialWalkthroughIndex((prev) => prev - 1);
                      }}
                    >
                      {({ pressed }) => (
                        <Text
                          style={{
                            fontFamily: "IBMPlexSans_500Medium",
                            fontSize: 16,
                            textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                            textDecorationLine: "underline",
                            textDecorationStyle: "solid",
                            color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                          }}
                        >
                          Back
                        </Text>
                      )}
                    </Pressable>


                    <Pressable
                      style={{
                        padding: 5,
                      }}
                      hitSlop={15}
                      onPressOut={(ev) => {
                        ev.preventDefault();
                        setTutorialWalkthroughIndex(-1)
                      }}
                    >
                      {({ pressed }) => (
                        <Text
                          style={{
                            // textAlign: "center",
                            fontFamily: "IBMPlexSans_500Medium",
                            fontSize: 16,
                            textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                            textDecorationLine: "underline",
                            textDecorationStyle: "solid",
                            color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                          }}
                        >
                          Close
                        </Text>
                      )}
                    </Pressable>


                    <Pressable
                      style={{
                        padding: 5,
                      }}
                      hitSlop={15}
                      onPress={() => {
                        setTutorialWalkthroughIndex((prev) => prev + 1);
                      }}
                    >
                      {({ pressed }) => (
                        <Text
                          style={{
                            fontFamily: "IBMPlexSans_500Medium",
                            fontSize: 16,
                            textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                            textDecorationLine: "underline",
                            textDecorationStyle: "solid",
                            color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                          }}
                        >
                          Next
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              }
              closeOnBackgroundInteraction={false}
              closeOnContentInteraction={false}
              closeOnChildInteraction={false}
              placement="right"
              useReactNativeModal={false}
              backgroundColor="transparent"
              horizontalAdjustment={-35}
              topAdjustment={-119}
              showChildInTooltip
              childContentSpacing={-25}
            >
              <Animated.View
                style={up}
              >
                <Pressable
                  hitSlop={10}
                  disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
                  onPress={() =>
                    dispatchHeadlightPosition({
                      side: leftRightSwapped ? "left" : "right",
                      percentage: (
                        (leftRightSwapped ? headlightPosition.left : headlightPosition.right) + (coarseAdjust ? 15 : 1) > 100)
                        ? 100
                        : (leftRightSwapped ? headlightPosition.left : headlightPosition.right) + (coarseAdjust ? 15 : 1),
                    })
                  }
                >
                  {({ pressed }) => (
                    <MaterialDesignIcons
                      size={(leftActive) ? 35 : 30}
                      color={disabledStatus ? colorTheme.disabledButtonColor : (pressed && tutorialWalkthroughIndex === -1) ? colorTheme.buttonColor : colorTheme.headerTextColor}
                      name="chevron-triple-up"
                    />
                  )}
                </Pressable>
              </Animated.View>
            </Tooltip>


            <Text
              style={{
                color: disabledStatus ? colorTheme.disabledButtonColor : colorTheme.headerTextColor,
                fontFamily: "IBMPlexSans_700Bold",
                fontSize: leftActive ? 16 : 14,
                textShadowColor: leftActive ? colorTheme.disabledButtonColor : `#00000000`,
                textShadowOffset: leftActive ? { height: 2, width: 2 } : undefined,
                textShadowRadius: leftActive ? 3 : undefined,
              }}
            >
              {leftRightSwapped ? headlightPosition.left : headlightPosition.right}%
            </Text>

            <Animated.View
              style={down}
            >
              <Pressable
                hitSlop={10}
                disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
                onPress={() =>
                  dispatchHeadlightPosition({
                    side: leftRightSwapped ? "left" : "right",
                    percentage: (
                      (leftRightSwapped ? headlightPosition.left : headlightPosition.right) - (coarseAdjust ? 15 : 1) < 0)
                      ? 0
                      : (leftRightSwapped ? headlightPosition.left : headlightPosition.right) - (coarseAdjust ? 15 : 1),
                  })
                }
              >
                {({ pressed }) => (
                  <MaterialDesignIcons
                    size={(leftActive) ? 35 : 30}
                    color={disabledStatus ? colorTheme.disabledButtonColor : (pressed && tutorialWalkthroughIndex === -1) ? colorTheme.buttonColor : colorTheme.headerTextColor}
                    name="chevron-triple-down" />
                )
                }
              </Pressable>
            </Animated.View>

          </View>


          {/* Tutorial First Item: Describes drag usage */}
          <Tooltip
            isVisible={tutorialWalkthroughIndex === 0}
            arrowStyle={{
              left: 10,
            }}
            contentStyle={[theme.tooltipContainer, {
              left: -40,
              maxWidth: 210,
              width: "500%",
              height: "auto",
              zIndex: 200,
              boxShadow: [{
                offsetX: 2,
                offsetY: 2,
                blurRadius: 5,
                color: colorTheme.backgroundPrimaryColor,
              }]
            }]}
            content={
              <>
                <Text
                  style={theme.tooltipContainerText}
                >
                  Swipe up and down to drag the headlight into the desired Sleepy Eye position
                </Text>

                <View
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingBottom: 4,
                    columnGap: 15,
                  }}
                >
                  <Pressable
                    style={{
                      padding: 5,
                    }}
                    hitSlop={15}
                    onPressOut={(ev) => {
                      setTutorialWalkthroughIndex(() => -1);
                    }}
                  >
                    {({ pressed }) => (
                      <Text
                        style={{
                          // textAlign: "center",
                          fontFamily: "IBMPlexSans_500Medium",
                          fontSize: 16,
                          textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                          textDecorationLine: "underline",
                          textDecorationStyle: "solid",
                          color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                        }}
                      >
                        Close
                      </Text>
                    )}
                  </Pressable>


                  <Pressable
                    style={{
                      padding: 5,
                    }}
                    hitSlop={15}
                    onPress={() => {
                      setTutorialWalkthroughIndex((prev) => prev + 1);
                    }}
                  >
                    {({ pressed }) => (
                      <Text
                        style={{
                          fontFamily: "IBMPlexSans_500Medium",
                          fontSize: 16,
                          textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                          textDecorationLine: "underline",
                          textDecorationStyle: "solid",
                          color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                        }}
                      >
                        Next
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            }
            closeOnBackgroundInteraction={false}
            closeOnContentInteraction={false}
            closeOnChildInteraction={false}
            placement="bottom"
            useReactNativeModal={false}
            backgroundColor="transparent"
            horizontalAdjustment={-15}
            topAdjustment={-119}
            childContentSpacing={159}
          >
            <View
              style={{
                position: "absolute",
                borderRadius: 20,
                backgroundColor: tutorialWalkthroughIndex === 0 ? `${colorTheme.headerTextColor}22` : "transparent",
                width: 100,
                left: 70,
                top: 0,
                height: 153,
                zIndex: tutorialWalkthroughIndex === 0 ? 1 : -10,
              }}
            />
          </Tooltip>


          <MiataHeadlights
            leftStatus={headlightPosition.left / 100}
            rightStatus={headlightPosition.right / 100}
          />


          <View
            style={{
              position: "absolute",
              right: 10,
              zIndex: 1,
            }}
            onTouchStart={() => setRightActive(!disabledStatus && tutorialWalkthroughIndex === -1)}
            onTouchEnd={() => { setRightActive(false); }}
          >
            <VerticalSlider
              value={leftRightSwapped ? headlightPosition["right"] : headlightPosition["left"]}
              max={100}
              min={0}
              step={coarseAdjust ? 15 : 1}
              ballIndicatorColor="orange"
              height={155}
              width={180}
              onChange={(value) => dispatchHeadlightPosition({ side: leftRightSwapped ? "right" : "left", percentage: value })}
              borderRadius={0}
              disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
              maximumTrackTintColor="#00000000"
              minimumTrackTintColor="#00000000"
              shadowProps={{
                shadowColor: "#00000000"
              }}
            />
          </View>

          <View
            style={{
              position: "absolute",
              right: 20,
              top: 0,
              zIndex: 2,
              height: "100%",
              width: 50,
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "column",
            }}
          >
            <Animated.View
              style={up}
            >
              <Pressable
                style={{
                  zIndex: 20,
                }}
                hitSlop={10}
                disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
                onPress={() =>
                  dispatchHeadlightPosition({
                    side: leftRightSwapped ? "right" : "left",
                    percentage: (
                      (leftRightSwapped ? headlightPosition.right : headlightPosition.left) + (coarseAdjust ? 15 : 1) > 100)
                      ? 100
                      : (leftRightSwapped ? headlightPosition.right : headlightPosition.left) + (coarseAdjust ? 15 : 1),
                  })
                }
              >
                {
                  ({ pressed }) => (
                    <MaterialDesignIcons
                      size={(rightActive) ? 35 : 30}
                      color={disabledStatus ? colorTheme.disabledButtonColor : (pressed && tutorialWalkthroughIndex === -1) ? colorTheme.buttonColor : colorTheme.headerTextColor}
                      name="chevron-triple-up"
                    />
                  )
                }
              </Pressable>
            </Animated.View>

            <Text
              style={{
                color: disabledStatus ? colorTheme.disabledButtonColor : colorTheme.headerTextColor,
                fontFamily: "IBMPlexSans_700Bold",
                fontSize: (rightActive) ? 16 : 14,
                textShadowColor: rightActive ? colorTheme.disabledButtonColor : `#00000000`,
                textShadowOffset: { height: 2, width: 2 },
                textShadowRadius: 3,
              }}
            >
              {leftRightSwapped ? headlightPosition.right : headlightPosition.left}%
            </Text>
            <Animated.View
              style={down}
            >

              <Pressable
                hitSlop={10}
                disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
                onPress={() =>
                  dispatchHeadlightPosition({
                    side: leftRightSwapped ? "right" : "left",
                    percentage: (
                      (leftRightSwapped ? headlightPosition.right : headlightPosition.left) - (coarseAdjust ? 15 : 1) < 0)
                      ? 0
                      : (leftRightSwapped ? headlightPosition.right : headlightPosition.left) - (coarseAdjust ? 15 : 1),
                  })
                }
              >
                {
                  ({ pressed }) => (
                    <MaterialDesignIcons
                      size={(rightActive) ? 35 : 30}
                      color={disabledStatus ? colorTheme.disabledButtonColor : (pressed && tutorialWalkthroughIndex === -1) ? colorTheme.buttonColor : colorTheme.headerTextColor}
                      name="chevron-triple-down" />
                  )
                }
              </Pressable>
            </Animated.View>

          </View>

        </View>


        {/* Tutorial Third Item: Describes Coarse Adjust usage */}

        <Tooltip
          isVisible={tutorialWalkthroughIndex === 2}
          contentStyle={[theme.tooltipContainer, {
            maxWidth: 210,
            width: "500%",
            height: "auto",
            zIndex: 200,
            boxShadow: [{
              offsetX: 2,
              offsetY: 2,
              blurRadius: 5,
              color: colorTheme.backgroundPrimaryColor,
            }]
          }]}

          content={
            <>
              <Text
                style={theme.tooltipContainerText}
              >
                Coarse Adjustment adjusts position by 15% per step when enabled, and 1% per step when disabled.
              </Text>

              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: 4,
                  columnGap: 15,
                }}
              >
                <Pressable
                  style={{
                    padding: 5,
                  }}
                  hitSlop={15}
                  onPressOut={(ev) => {
                    setTutorialWalkthroughIndex((prev) => prev - 1);
                  }}
                >
                  {({ pressed }) => (
                    <Text
                      style={{
                        // textAlign: "center",
                        fontFamily: "IBMPlexSans_500Medium",
                        fontSize: 16,
                        textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                        textDecorationLine: "underline",
                        textDecorationStyle: "solid",
                        color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      }}
                    >
                      Back
                    </Text>
                  )}
                </Pressable>


                <Pressable
                  style={{
                    padding: 5,
                  }}
                  hitSlop={15}
                  onPress={() => {
                    setTutorialWalkthroughIndex((prev) => -1);
                  }}
                >
                  {({ pressed }) => (
                    <Text
                      style={{
                        fontFamily: "IBMPlexSans_500Medium",
                        fontSize: 16,
                        textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                        textDecorationLine: "underline",
                        textDecorationStyle: "solid",
                        color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      }}
                    >
                      Done
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          }
          placement="bottom"
          useReactNativeModal={false}
          closeOnBackgroundInteraction={false}
          closeOnContentInteraction={false}
          closeOnChildInteraction={false}
          backgroundColor="transparent"
          horizontalAdjustment={-15}
          topAdjustment={-119}
          parentWrapperStyle={{ width: "100%", alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            style={{
              flexDirection: "row",
              width: "50%",
              justifyContent: "center",
              alignItems: "center",
              columnGap: 10,
              marginBottom: 10,
            }}
            hitSlop={10}
            onPress={() => setCoarseAdjust((old) => !old)}
            disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
          >
            {
              ({ pressed }) => (
                <>
                  <Text
                    style={{
                      color: disabledStatus ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                    }}
                  >
                    Coarse Adjust
                  </Text>
                  <IonIcons
                    color={disabledStatus ? colorTheme.disabledButtonColor : (pressed) ? colorTheme.buttonColor : colorTheme.headerTextColor}
                    name={coarseAdjust ? "checkbox-outline" : "square-outline"}
                    size={18}
                    style={{
                      marginTop: 2,
                    }}
                  />
                </>
              )
            }
          </Pressable>
        </Tooltip>
      </View>

      <TooltipHeader
        useModal={false}
        tooltipContent={
          <>
            <Text style={theme.tooltipContainerText}>
              Quick presets for each headlight side when{"\n"}Sleepy Eye Mode is active.{"\n"}
              High = 75%{"\n"}
              Middle = 50%{"\n"}
              Low = 25%
            </Text>
          </>
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
                    disabled={disabledStatus || tutorialWalkthroughIndex !== -1}
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


      <SettingsToolbar
        disabled={disabledStatus}
        reset={() => {
          setSleepyEyeValues(50, 50);
          dispatchHeadlightPosition({ side: "left", percentage: 50 });
          dispatchHeadlightPosition({ side: "right", percentage: 50 });
        }}
        save={() => setSleepyEyeValues(headlightPosition.left, headlightPosition.right)}
        resetText="Reset Value"
        saveText="Save Value"
      />

    </SafeAreaView>
  )

}