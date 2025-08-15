import { Pressable, Text, View, ViewStyle } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";

interface ILongButtonProps {
  disabled?: boolean;
  onPress: () => void;
  icons: {
    names: [keyof typeof IonIcons.glyphMap | null, keyof typeof IonIcons.glyphMap | null];
    size: [number | null, number | null];
  },
  text: string;
  pressableStyle?: ViewStyle;
};

export function LongButton({
  disabled,
  onPress,
  icons,
  text,
  pressableStyle
}: ILongButtonProps) {

  const { theme, colorTheme } = useColorTheme();

  return (
    <Pressable
      style={({ pressed }) => ([
        theme.mainLongButtonPressableContainer,
        {
          backgroundColor: pressed ? colorTheme.buttonColor :
            disabled ? colorTheme.disabledButtonColor : colorTheme.backgroundSecondaryColor
        },
        {
          ...pressableStyle
        }
      ])}
      onPress={onPress}
    >
      {
        ({ pressed }) => (
          <>
            <View style={theme.mainLongButtonPressableView}>
              {
                icons.names[0] === null ? <></> :
                  <IonIcons name={icons.names[0] as any} size={icons.size[0]!} color={colorTheme.headerTextColor} />
              }
              <Text style={theme.mainLongButtonPressableText}>
                {text}
              </Text>
            </View>
            {
              icons.names[1] === null ? <></> :
                <IonIcons style={theme.mainLongButtonPressableIcon} name={icons.names[1] as any} size={icons.size[1]!} color={colorTheme.headerTextColor} />
            }
          </>
        )
      }
    </Pressable>
  )
}