import { Pressable, Text, View } from "react-native";
import { CommandOutput, CustomCommandStore } from "../Storage";

interface ICustomCommandProps {
  command: CommandOutput;
  onEdit: () => void;
}

export function CustomCommand({ command, onEdit }: ICustomCommandProps) {

  const onDelete = () => {
    CustomCommandStore.deleteCommand(command.name);
  }

  return (
    <View
      style={{
        backgroundColor: "pink",
        width: "80%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
      }}
    >

      <Text>
        {command.name}
      </Text>

      <Text>
        Command Action Body
      </Text>

      <View >
        <Pressable onPress={onEdit}>
          <Text>Edit</Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text>Delete</Text>
        </Pressable>
      </View>

    </View>
  )
}