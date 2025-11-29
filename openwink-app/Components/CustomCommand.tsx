import { Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";

import { CustomCommandStore } from "../Storage";
import { useColorTheme } from "../hooks/useColorTheme";
import { CommandOutput } from "../helper/Types";
interface ICustomCommandProps {
  command: CommandOutput;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomCommand({ command, onEdit, onDelete }: ICustomCommandProps) {

  const { theme, colorTheme } = useColorTheme();

  const __onDelete = () => {
    CustomCommandStore.deleteCommand(command.name);
    onDelete();
  }

  return (
    <View
      style={[theme.mainLongButtonPressableContainer, {
        boxShadow: "0 0px 5px rgba(0, 0, 0,0.3)"
      }]}
    >

      <View style={theme.mainLongButtonPressableView}>
        <Text style={theme.mainLongButtonPressableText}>
          {command.name}
        </Text>
      </View>

      <View style={[theme.mainLongButtonPressableIcon, { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 65, }]}>
        <Pressable onPress={onEdit} hitSlop={10}>
          {
            ({ pressed }) =>
              <IonIcons name="create-outline" size={20} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
          }
        </Pressable>
        <Pressable onPress={__onDelete} hitSlop={10}>
          {
            ({ pressed }) =>
              <IonIcons name="close" size={20} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
          }
        </Pressable>
      </View>

    </View>
  )
}