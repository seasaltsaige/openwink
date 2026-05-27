import { useEffect } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { ColorTheme } from "../helper/Constants";

/**
 * Themed splash overlay. Mirrors the Android system splash (theme color bg +
 * centered icon held for ~700ms then faded). Absolutely positioned so it can
 * be layered on top of the full app tree while providers/navigation mount
 * underneath.
 *
 * iOS LaunchScreen is static (white/black system bg with a transparent 1×1
 * placeholder), so this overlay covers it as soon as React mounts and is the
 * only theme-aware splash the user actually sees.
 */

const iconByTheme: Record<ColorTheme.ThemeKey, number> = {
  crystalWhite:       require("../assets/icon_crystal_white.png"),
  brilliantBlack:     require("../assets/icon_burgundy.png"),
  classicRed:         require("../assets/icon_classic_red.png"),
  sunburstYellow:     require("../assets/icon_sunburst_yellow.png"),
  marinerBlue:        require("../assets/icon_marina_blue.png"),
  britishRacingGreen: require("../assets/icon_british_racing_green.png"),
};

export const splashBackgroundByTheme: Record<ColorTheme.ThemeKey, string> = {
  crystalWhite:       "#bd9664",
  brilliantBlack:     "#550000",
  classicRed:         "#c8102e",
  sunburstYellow:     "#ffcc00",
  marinerBlue:        "#0033a0",
  britishRacingGreen: "#004d26",
};

const SYSTEM_LIGHT_BG = "#ffffff";
const SYSTEM_DARK_BG  = "#000000";

const FADE_IN_MS  = 250;
const HOLD_MS     = 700;
const FADE_OUT_MS = 350;

type Props = {
  themeName: ColorTheme.ThemeKey;
  contentReady?: boolean;
  onLayout?: () => void;
  onHidden?: () => void;
};

export function ThemedSplash({ themeName, contentReady = true, onLayout, onHidden }: Props) {
  const scheme  = useColorScheme();
  const startBg = scheme === "dark" ? SYSTEM_DARK_BG : SYSTEM_LIGHT_BG;
  const endBg   = splashBackgroundByTheme[themeName];

  const fadeIn  = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    fadeIn.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  useEffect(() => {
    if (!contentReady) return;
    fadeOut.value = withDelay(
      HOLD_MS,
      withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished && onHidden) runOnJS(onHidden)();
        },
      ),
    );
  }, [contentReady]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fadeIn.value, [0, 1], [startBg, endBg]),
    opacity: fadeOut.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: 0.92 + fadeIn.value * 0.08 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      onLayout={onLayout}
    >
      <Animated.View style={[styles.iconMask, iconStyle]}>
        <Animated.Image source={iconByTheme[themeName]} style={styles.icon} />
      </Animated.View>
    </Animated.View>
  );
}

const ICON_SIZE = 200;
const ICON_RADIUS = ICON_SIZE / 2;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconMask: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    overflow: "hidden",
  },
  icon: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
