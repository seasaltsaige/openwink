import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import { FlatList } from "react-native-gesture-handler";

import { LinearGradient } from "react-native-linear-gradient";
interface IInfoPageHeaderProps<T extends string> {
  categories: readonly T[];
  initialValue?: T;
  onSelect: (category: T) => void;
  hiddenBorderColor: string;
}

export function InfoPageHeader<R extends string>({
  categories,
  onSelect,
  hiddenBorderColor,
  initialValue
}: IInfoPageHeaderProps<R>) {

  const { colorTheme } = useColorTheme();
  const listRef = useRef<FlatList>(null);

  const [selectedCategory, setSelectedCategory] = useState(initialValue ? initialValue : categories[0]);

  const _updateSelectedCategory = (category: R, index: number) => {
    onSelect(category);
    setSelectedCategory(category);
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }

  return (
    <View style={{
      height: 50,
      position: "relative",
      paddingHorizontal: 10,
    }}>

      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[hiddenBorderColor, "transparent"]}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: 50,
          width: 25,
          zIndex: 1000,
        }}
        pointerEvents="none"
      />

      <FlatList
        ref={listRef}
        horizontal
        contentContainerStyle={{
          flexDirection: "row",
          justifyContent: "flex-start",
          columnGap: 25,
          height: "100%",
        }}


        data={categories}
        renderItem={({ index, separators, item: category }) => (
          <Pressable
            style={({ pressed }) => ({
              borderTopColor: hiddenBorderColor,
              borderLeftColor: hiddenBorderColor,
              borderRightColor: hiddenBorderColor,
              borderBottomColor: selectedCategory === category ? colorTheme.headerTextColor : hiddenBorderColor,
              borderWidth: 2,
              height: "100%",
              paddingHorizontal: 10,
              borderRadius: 2,
            })}
            onPress={() => _updateSelectedCategory(category, index)}
            key={`${category}-${index}-cat-header`}
          >
            {
              ({ pressed }) => (

                <Text
                  style={{
                    color: (pressed) ? colorTheme.buttonColor : (selectedCategory !== category) ? `${colorTheme.headerTextColor}BB` : colorTheme.headerTextColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 18,
                    textDecorationStyle: "solid",
                  }}
                >
                  {category}
                </Text>
              )
            }
          </Pressable>
        )}
      />


      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={["transparent", hiddenBorderColor]}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: 50,
          width: 25
        }}
        pointerEvents="none"
      />

    </View>
  );

}