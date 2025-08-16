import { useState } from "react";
import { DefaultCommandValue } from "../../../helper/Constants";
import { CommandOutput } from "../../../Storage";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { CustomCommand } from "../../../Components/CustomCommand";
import IonIcons from "@expo/vector-icons/Ionicons";
import { HeaderWithBackButton } from "../../../Components";
import { useRoute } from "@react-navigation/native";


interface IMainViewProps {

}

export function MainView({ }: IMainViewProps) {
  const { theme, colorTheme } = useColorTheme();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [customCommands, setCustomCommands] = useState([
    { name: "Test Command", command: [{ transmitValue: DefaultCommandValue.RIGHT_WINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
    { name: "Test Command 2", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
    { name: "Test Command 3", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
    { name: "Test Command 4", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
    { name: "Test Command 5", command: [{ transmitValue: DefaultCommandValue.RIGHT_WAVE }, { delay: 150 }, { transmitValue: DefaultCommandValue.BOTH_BLINK }, { delay: 150 }, { transmitValue: DefaultCommandValue.LEFT_WAVE }] },
    { name: "Test Command 6", command: [{ transmitValue: DefaultCommandValue.LEFT_WINK }, { transmitValue: DefaultCommandValue.RIGHT_WINK }] },
  ] as CommandOutput[]);

  return (
    <View style={theme.container}>


      <HeaderWithBackButton
        backText={back}
        headerText="Create Custom"
        headerTextStyle={theme.settingsHeaderText}
      />

      <Pressable
        style={({ pressed }) => [
          theme.modalSettingsConfirmationButton,
          {
            backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor
          }
        ]}>
        <View style={{ display: "flex", flexDirection: "row", columnGap: 10, alignItems: "center", justifyContent: "space-evenly" }}>
          <IonIcons name="create-outline" size={23} color={colorTheme.headerTextColor} />
          <Text style={theme.modalSettingsConfirmationButtonText}>
            Create New Command
          </Text>
        </View>
      </Pressable>

      <View style={{ height: "93%", width: "100%" }}>
        <ScrollView contentContainerStyle={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 12,
          // backgroundColor: "orange"
        }}>


          {
            customCommands.map(command => (
              <CustomCommand
                command={command}
                onEdit={() => { }}
                key={command.name}
              />
            ))
          }


        </ScrollView>
      </View>
    </View>
  )

}