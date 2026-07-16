import { Image, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { MiataHeadlights } from "../../../Components";
import { useCallback, useEffect, useState } from "react";
import { cancelAnimation, Easing, runOnJS, useAnimatedReaction, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import LinearGradient from "react-native-linear-gradient";

const MIN = 50;

export function Landing() {
  const { colorTheme, theme } = useColorTheme();

  const { waveDelayMulti, leftMoveTime, rightMoveTime } = useBleMonitor();

  const [min, setMin] = useState(MIN);


  useEffect(() => {
    if (waveDelayMulti * 100 !== MIN)
      setMin(parseFloat((waveDelayMulti * 100).toPrecision(2)));
  }, []);

  useEffect(() => {
    setMin(waveDelayMulti * 100);
  }, [waveDelayMulti])

  const leftWaveStatus = useSharedValue(100);
  const rightWaveStatus = useSharedValue(100);

  const [lw, setLeftWave] = useState(100);
  const [rw, setRightWave] = useState(100);

  const animateWave = useCallback(() => {

    cancelAnimation(leftWaveStatus);
    cancelAnimation(rightWaveStatus);

    const LOOP_PAUSE = 250;

    leftWaveStatus.value = withRepeat(
      withSequence(
        withTiming(0, {
          duration: leftMoveTime,
          easing: Easing.linear,
        }),
        withTiming(100, {
          duration: rightMoveTime,
          easing: Easing.linear,
        }),
        withDelay(
          LOOP_PAUSE,
          withTiming(100, { duration: 0 }),
        )
      ),
      -1,
      false
    );

    rightWaveStatus.value = withDelay(
      leftMoveTime * 0.5,
      withRepeat(
        withSequence(
          withTiming(0, {
            duration: rightMoveTime,
            easing: Easing.linear,
          }),
          withTiming(100, {
            duration: rightMoveTime,
            easing: Easing.linear,
          }),
          withDelay(
            LOOP_PAUSE,
            withTiming(100, { duration: 0 })
          )
        ),
        -1,
        false
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
    animateWave();
    return () => {
      cancelAnimation(leftWaveStatus);
      cancelAnimation(rightWaveStatus);
    }
  }, []);


  return (
    <View style={{
      flex: 1,
      width: "100%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
      rowGap: 20,
    }}>


      <View style={{ flex: 1, }} />
      <View style={[theme.defaultCommandSectionContainer, {
        transform: [{ rotate: "-7deg" }],
        marginBottom: 50,
      }]}>
        <Text style={[theme.commandSectionHeader, {
          opacity: 0.6
        }]}>Macros</Text>

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
              backgroundColor: colorTheme.buttonColor,
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
        marginTop: 20,
      }}>
        Control every Wink, Blink, and Wave
      </Text>

      <Text style={{
        fontFamily: "IBMPlexSans_400Regular",
        textAlign: "left",
        fontSize: 16.5,
        color: `${colorTheme.headerTextColor}B0`,
        marginBottom: 45,
      }}>
        Your Miata can say more than hello. Design custom pop up headlight movements, change how they animate, and save them as gestures to use when the moment is right.
      </Text>
    </View>
  )
}