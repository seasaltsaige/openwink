import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";

interface IMileStoneProgressBar {
  currentIndex: number;
  itemCount: number;

  barHeight: number;

  incompleteColor: string;
  currentColor: string;

  indexPressed: (index: number) => void;
}

export function MilestoneProgressBar({
  barHeight,
  incompleteColor,
  currentColor,
  itemCount,
  currentIndex,

  indexPressed
}: IMileStoneProgressBar) {

  const gapWidth = (100 / (itemCount + 100));
  let itemWidth = (100 / itemCount) - gapWidth;
  if (itemCount === 1) itemWidth += gapWidth;

  return (
    <View style={{
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      columnGap: `${gapWidth}%`,
      justifyContent: "flex-start",
      position: "relative",
    }}>

      {
        (Array.from(Array(itemCount), (__, i) => (
          <Pressable
            key={i}
            hitSlop={{
              bottom: 15,
              top: 15,
              left: 1,
              right: 1,
            }}
            onPress={() => indexPressed(i)}
            style={{
              width: `${itemWidth}%`,
              height: barHeight + (i === currentIndex ? (barHeight / 2) : 0),
              backgroundColor: i <= currentIndex ?
                currentColor : incompleteColor,
              position: "relative",
              borderRadius: 200,
            }}
          />
        )))
      }

    </View>
  )
}