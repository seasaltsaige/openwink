import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import { FlatList } from "react-native-gesture-handler";

interface IInfoPageHeaderProps<T extends string> {
  categories: readonly T[],
  onSelect: (category: T) => void;
}

export function InfoPageHeader<R extends string>({
  categories,
  onSelect
}: IInfoPageHeaderProps<R>) {

  const { colorTheme } = useColorTheme();
  const listRef = useRef<FlatList>(null);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const _updateSelectedCategory = (category: R, index: number) => {
    onSelect(category);
    setSelectedCategory(category);
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });

  }

  return (
    <View style={{
      height: 50,
    }}>
      <FlatList
        ref={listRef}
        horizontal
        contentContainerStyle={{
          flexDirection: "row",
          justifyContent: "flex-start",
          columnGap: 30,
          height: "100%",
        }}

        data={categories}
        renderItem={({ index, separators, item: category }) => (
          <Pressable
            style={({ pressed }) => ({
              borderTopColor: colorTheme.backgroundPrimaryColor,
              borderLeftColor: colorTheme.backgroundPrimaryColor,
              borderRightColor: colorTheme.backgroundPrimaryColor,
              borderBottomColor: colorTheme.headerTextColor,
              borderWidth: (selectedCategory === category) ? 2 : 0,
              top: selectedCategory === category ? -2 : 0,
              height: "100%",
              borderRadius: 2,
            })}
            onPress={() => _updateSelectedCategory(category, index)}
            key={category}
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

    </View>
  );

}