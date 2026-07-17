import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { cancelAnimation, Easing, runOnJS, useAnimatedReaction, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useCallback, useEffect, useState } from "react";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { MiataHeadlights } from "../../../Components";
import LinearGradient from "react-native-linear-gradient";


// const MIN = 10;

export function WaveSleepy() {
  const { colorTheme, theme } = useColorTheme();

  const { waveDelayMulti, leftMoveTime, rightMoveTime } = useBleMonitor();

  const [min, setMin] = useState(25);

  useEffect(() => {
    setMin(waveDelayMulti * 100);
  }, [waveDelayMulti]);


  const leftWaveStatus = useSharedValue(100);
  const rightWaveStatus = useSharedValue(100);

  const [lw, setLeftWave] = useState(100);
  const [rw, setRightWave] = useState(100);

  const animateWave = useCallback(() => {
    cancelAnimation(leftWaveStatus);
    cancelAnimation(rightWaveStatus);

    leftWaveStatus.value = 100;
    rightWaveStatus.value = 100;

    const LOOP_PAUSE = 250;
    const SLEEPY_PAUSE = 700;
    const BETWEEN_VARIANTS_PAUSE = 500;

    const sleepyDownTime = (leftMoveTime + rightMoveTime) / 2;
    const sleepyToTargetTime = 375;
    const sleepyHoldTime = 500;
    const sleepyOpenTime = 500;

    const firstWaveDelay = 0.25;
    const secondWaveDelay = 0.75;

    const firstSleepyLeftHeight = 75;
    const firstSleepyRightHeight = 50;

    const secondSleepyLeftHeight = 25;
    const secondSleepyRightHeight = 60;

    const firstRightDelayMs = leftMoveTime * firstWaveDelay;
    const secondRightDelayMs = leftMoveTime * secondWaveDelay;

    const leftWaveDuration = leftMoveTime + rightMoveTime;
    const rightWaveDuration = rightMoveTime * 2;

    const firstWaveSlotDuration = Math.max(
      leftWaveDuration,
      firstRightDelayMs + rightWaveDuration,
    );

    const secondWaveSlotDuration = Math.max(
      leftWaveDuration,
      secondRightDelayMs + rightWaveDuration,
    );

    const firstLeftAfterWavePause =
      firstWaveSlotDuration - leftWaveDuration;

    const firstRightAfterWavePause =
      firstWaveSlotDuration - firstRightDelayMs - rightWaveDuration;

    const secondLeftAfterWavePause =
      secondWaveSlotDuration - leftWaveDuration;

    const secondRightAfterWavePause =
      secondWaveSlotDuration - secondRightDelayMs - rightWaveDuration;

    const makeHold = (value: number, duration: number) =>
      duration <= 0
        ? withTiming(value, { duration: 0 })
        : withDelay(duration, withTiming(value, { duration: 0 }));

    const makeOpenPause = (duration: number) =>
      makeHold(100, duration);

    const makeLeftWave = () =>
      withSequence(
        withTiming(0, {
          duration: leftMoveTime,
          easing: Easing.linear,
        }),
        withTiming(100, {
          duration: rightMoveTime,
          easing: Easing.linear,
        }),
      );

    const makeRightWave = () =>
      withSequence(
        withTiming(0, {
          duration: rightMoveTime,
          easing: Easing.linear,
        }),
        withTiming(100, {
          duration: rightMoveTime,
          easing: Easing.linear,
        }),
      );

    const makeSleepyEye = (height: number) =>
      withSequence(
        withTiming(0, {
          duration: sleepyDownTime,
          easing: Easing.inOut(Easing.ease),
        }),

        withTiming(height, {
          duration: sleepyToTargetTime,
          easing: Easing.out(Easing.ease),
        }),

        makeHold(height, sleepyHoldTime),

        withTiming(100, {
          duration: sleepyOpenTime,
          easing: Easing.inOut(Easing.ease),
        }),
      );

    leftWaveStatus.value = withRepeat(
      withSequence(
        makeLeftWave(),
        makeOpenPause(firstLeftAfterWavePause),

        makeOpenPause(SLEEPY_PAUSE),
        makeSleepyEye(firstSleepyLeftHeight),

        makeOpenPause(BETWEEN_VARIANTS_PAUSE),

        makeLeftWave(),
        makeOpenPause(secondLeftAfterWavePause),

        makeOpenPause(SLEEPY_PAUSE),
        makeSleepyEye(secondSleepyLeftHeight),

        makeOpenPause(LOOP_PAUSE),
      ),
      -1,
      false,
    );

    rightWaveStatus.value = withRepeat(
      withSequence(
        makeOpenPause(firstRightDelayMs),
        makeRightWave(),
        makeOpenPause(firstRightAfterWavePause),

        makeOpenPause(SLEEPY_PAUSE),
        makeSleepyEye(firstSleepyRightHeight),

        makeOpenPause(BETWEEN_VARIANTS_PAUSE),

        makeOpenPause(secondRightDelayMs),
        makeRightWave(),
        makeOpenPause(secondRightAfterWavePause),

        makeOpenPause(SLEEPY_PAUSE),
        makeSleepyEye(secondSleepyRightHeight),

        makeOpenPause(LOOP_PAUSE),
      ),
      -1,
      false,
    );

  }, [
    min,
    leftMoveTime,
    rightMoveTime,
    leftWaveStatus,
    rightWaveStatus,
  ]);

  useAnimatedReaction(
    () => leftWaveStatus.value,
    (value) => runOnJS(setLeftWave)(value),
  );
  useAnimatedReaction(
    () => rightWaveStatus.value,
    (value) => runOnJS(setRightWave)(value),
  );


  useEffect(() => {
    animateWave();

    return () => {
      cancelAnimation(leftWaveStatus);
      cancelAnimation(rightWaveStatus);
    };
  }, [animateWave, leftWaveStatus, rightWaveStatus]);

  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>

      <View style={{ flex: 1 }} />


      <View style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
        transform: [{ rotate: "-7deg" }, { scale: 0.85 }],
        // marginBottom: ,
      }}>

        <View style={[theme.defaultCommandSectionContainer, { opacity: 0.6 }]}>

          <Text style={theme.commandSectionHeader}>
            Macros
          </Text>

          <View
            style={
              [
                theme.commandRowContainer,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  opacity: 0.6
                }
              ]
            }>

            <View
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                width: "50%",
                rowGap: 12
              }}
            >

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Left Wave
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                width: "95%",
                paddingHorizontal: 20,
              }]}>

                <Text style={theme.commandButtonText}>
                  Left-Right
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                width: "95%",
                paddingHorizontal: 20,
              }]}>

                <Text style={theme.commandButtonText}>
                  Left-Right x2
                </Text>
              </View>


            </View>

            <View
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                width: "50%",
                rowGap: 12
              }}
            >

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Right Wave
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Right-Left
                </Text>
              </View>

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Right-Left x2
                </Text>
              </View>
            </View>

          </View>

        </View>

        <View style={{ width: "100%", height: 1.5, backgroundColor: `${colorTheme.disabledButtonColor}80`, borderRadius: 10, marginVertical: 15 }} />


        <View style={[theme.defaultCommandSectionContainer, { opacity: 0.6 }]}>

          <View
            style={
              [
                theme.commandRowContainer,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  opacity: 0.6
                }
              ]
            }>

            <View
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                width: "50%",
                rowGap: 12
              }}
            >

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Sleepy Eye
                </Text>
              </View>


            </View>

            <View
              style={{
                alignItems: "center",
                justifyContent: "flex-start",
                width: "50%",
                rowGap: 12
              }}
            >

              <View style={[theme.commandButton, {
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 20,
                width: "95%",
              }]}>

                <Text style={theme.commandButtonText}>
                  Reset
                </Text>
              </View>

            </View>

          </View>

        </View>

        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[colorTheme.backgroundPrimaryColor, "transparent"]}
          style={{
            position: "absolute",
            left: -10,
            top: 0,
            height: "115%",
            width: "110%",
            zIndex: 1000,
          }}
          pointerEvents="none"
        />
      </View>



      <MiataHeadlights
        leftStatus={lw / 100}
        rightStatus={rw / 100}
      />


      <Text style={{
        fontFamily: "IBMPlexSans_700Bold",
        textAlign: "left",
        fontSize: 30,
        color: colorTheme.headerTextColor,
        // width: "90%",
        marginTop: 20,
      }}>
        Dial in your Settings
      </Text>


      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "left",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
        // width: "90%",
      }}>
        Customize the exact delay between headlight movements when waving hello to other Miatas, allowing for smooth, continuous movement.
      </Text>

    </View>
  )
}