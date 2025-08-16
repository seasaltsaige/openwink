import { Pressable, Text, View } from "react-native";
import { CommandOutput, CustomCommandStore } from "../Storage";
import { useColorTheme } from "../hooks/useColorTheme";
import { DefaultCommandValueEnglish } from "../helper/Constants";
interface ICustomCommandProps {
  command: CommandOutput;
  onEdit: () => void;
}

export function CustomCommand({ command, onEdit }: ICustomCommandProps) {

  const { theme, colorTheme } = useColorTheme();

  const onDelete = () => {
    CustomCommandStore.deleteCommand(command.name);
  }

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundSecondaryColor,
        width: "80%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        rowGap: 4,
        boxShadow: "0 0px 5px rgba(0, 0, 0,0.3)"
      }}
    >

      <Text style={{ color: colorTheme.headerTextColor, fontSize: 18, fontFamily: "IBMPlexSans_500Medium" }}>
        {command.name}
      </Text>

      <Text style={{ textAlign: "center", color: colorTheme.headerTextColor, fontSize: 16, fontFamily: "IBMPlexSans_400Regular" }}>
        {
          command.command ? (
            command.command.map(cmd => cmd.transmitValue ? DefaultCommandValueEnglish[cmd.transmitValue! - 1] : `${cmd.delay} ms Delay`).join(" → ").slice(0, 50)
          ) : "Command Data not found"
        }...
      </Text>

      <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", width: "100%" }}>
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