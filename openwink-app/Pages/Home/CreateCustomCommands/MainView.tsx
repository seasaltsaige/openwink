import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRoute } from "@react-navigation/native";

import { DefaultCommandValueEnglish } from "../../../helper/Constants";
import { AUX_ID, AuxButtonStore, CustomCommandStore, CustomOEMButtonStore } from "../../../Storage";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { HeaderWithBackButton, SearchBarFilter, CustomCommand } from "../../../Components";
import { ModifyType } from "./ModifyView";
import { CommandOutput } from "../../../helper/Types";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";

interface IMainViewProps {
  setModifyType: (type: ModifyType) => void;
  setEditCommandName: React.Dispatch<React.SetStateAction<string>>;
}

const FILTERS = ["Delay", ...DefaultCommandValueEnglish] as const;

export function MainView({ setModifyType, setEditCommandName }: IMainViewProps) {
  const { theme, colorTheme } = useColorTheme();
  const { setAux1Action, setAux2Action } = useBleMonitor();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [customCommands, setCustomCommands] = useState([] as CommandOutput[]);
  const [filteredCommands, setFilteredCommands] = useState([] as CommandOutput[]);

  const getCommandsFromStorage = () => {
    const storedCommands = CustomCommandStore.getAll();
    setCustomCommands(storedCommands);
    setFilteredCommands(storedCommands);
  }

  const handleDeleteCommand = (deletedName: string) => {
    CustomCommandStore.deleteCommand(deletedName);

    // Remove deleted command's name from any OEM button bindings while preserving its sequence
    const allCustomButtons = CustomOEMButtonStore.getAllBy((press) => press.customCommand !== undefined);
    for (const btnAction of allCustomButtons) {
      if (btnAction.customCommand?.name === deletedName) {
        CustomOEMButtonStore.set(btnAction.presses, {
          name: "",
          command: btnAction.customCommand.command,
        });
      }
    }

    // Remove deleted command's name from any Aux button bindings while preserving its sequence
    for (const auxId of [AUX_ID.AUX1, AUX_ID.AUX2]) {
      const auxAction = AuxButtonStore.getAuxButtonAction(auxId);
      if (typeof auxAction === "object" && auxAction.name === deletedName) {
        const unnamedCmd: CommandOutput = {
          name: "",
          command: auxAction.command,
        };
        AuxButtonStore.setAuxButtonAction(auxId, unnamedCmd);
        if (auxId === AUX_ID.AUX1) {
          setAux1Action(unnamedCmd);
        } else {
          setAux2Action(unnamedCmd);
        }
      }
    }

    getCommandsFromStorage();
  };

  useFocusEffect(useCallback(() => {
    getCommandsFromStorage();
  }, []));

  return (
    <View style={theme.container}>

      <HeaderWithBackButton
        backText={back}
        headerText="View Commands"
        headerTextStyle={{ ...theme.settingsHeaderText, fontSize: 28 }}
      />

      <View style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 20,
      }}>

        <View style={{
          width: "85%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 5,
          columnGap: 10,
          marginTop: 10,
        }}>

          <Pressable
            hitSlop={10}
            onPress={() => { setEditCommandName(""); setModifyType(ModifyType.CREATE); }}
          >
            {
              ({ pressed }) =>
                <IonIcons name="add" size={27} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
            }
          </Pressable>
          <SearchBarFilter
            useFilters
            searchFilterKey="name"
            filterTitleText="Filter by Command Type"
            filters={FILTERS}
            filterFn={({ filterType, itemsToFilter, selectedFilters }) => {
              if (selectedFilters.length < 1) return itemsToFilter;

              const filteredItems: CommandOutput[] = [];
              for (const cmd of itemsToFilter) {
                if (!cmd.command) continue;

                const mappedCommands = cmd.command.map(c => c.delay ? "Delay" : (DefaultCommandValueEnglish[c.transmitValue! - 1]));

                if (filterType === "inclusive") {
                  for (const filter of selectedFilters) {
                    if (mappedCommands.includes(filter)) {
                      filteredItems.push(cmd);
                      break;
                    }
                  }
                } else {
                  let includesAll = false;
                  for (let i = 0; i < selectedFilters.length; i++) {
                    const filter = selectedFilters[i];
                    if (!mappedCommands.includes(filter)) break;
                    if (i === selectedFilters.length - 1) includesAll = true;
                  }

                  if (includesAll) filteredItems.push(cmd);
                }
              }
              return filteredItems;
            }}
            filterables={customCommands}
            onFilteredItemsUpdate={(filteredItems) => setFilteredCommands(filteredItems)}
            onFilterTextChange={(filterText) => { }}
            onFiltersChange={(selectedFilters) => { }}
            placeholderText="Find command by name..."
          />
        </View>

        <View style={{
          height: "88%"
        }}>
          <ScrollView contentContainerStyle={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 14,
          }}>
            {
              filteredCommands.length > 0 ?
                filteredCommands.map(command => (
                  <CustomCommand
                    command={command}
                    onEdit={() => { setModifyType(ModifyType.EDIT); setEditCommandName(command.name); }}
                    onDelete={() => handleDeleteCommand(command.name)}
                    key={command.name}
                  />
                ))
                : <Text style={{ color: colorTheme.headerTextColor, fontSize: 22, fontFamily: "IBMPlexSans_700Bold" }}>
                  No Commands Found
                </Text>
            }
          </ScrollView>
        </View>
      </View>
    </View>
  )

}