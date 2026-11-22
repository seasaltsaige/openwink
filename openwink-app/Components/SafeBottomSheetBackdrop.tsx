import { useCallback, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { BottomSheetBackdropProps, useBottomSheet } from "@gorhom/bottom-sheet";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Replacement for @gorhom/bottom-sheet's BottomSheetBackdrop on Reanimated 4 + Fabric.
 * Upstream BottomSheetBackdrop initializes pointerEvents="auto" with isMounted=false,
 * dropping the initial index=-1 reaction and leaving an invisible full-screen view
 * blocking all touches behind closed bottom sheets.
 */
export function SafeBottomSheetBackdrop({
  animatedIndex,
  style,
}: BottomSheetBackdropProps) {
  const { close } = useBottomSheet();
  const [isOpen, setIsOpen] = useState(false);

  const updateOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  useAnimatedReaction(
    () => animatedIndex.value > -1,
    (open, previous) => {
      if (open !== previous) {
        scheduleOnRN(updateOpen, open);
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 0.5],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <AnimatedPressable
      onPress={() => close()}
      pointerEvents={isOpen ? "auto" : "none"}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "rgba(0, 0, 0, 1)" },
        style,
        animatedStyle,
      ]}
    />
  );
}
