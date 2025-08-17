import { useCallback, useRef, useState } from "react";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../../../helper/Constants";
import { CommandOutput, CustomCommandStore } from "../../../Storage";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { CustomCommand } from "../../../Components/CustomCommand";
import IonIcons from "@expo/vector-icons/Ionicons";
import { HeaderWithBackButton } from "../../../Components";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ModifyType } from "./ModifyView";
import ToggleSwitch from "toggle-switch-react-native";

interface IMainViewProps {
  setModifyType: (type: ModifyType) => void;
  setEditCommandName: React.Dispatch<React.SetStateAction<string>>;
}

const FILTERS = ["Delay", ...DefaultCommandValueEnglish] as const;

export function MainView({ setModifyType, setEditCommandName }: IMainViewProps) {
  const { theme, colorTheme } = useColorTheme();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [customCommands, setCustomCommands] = useState([] as CommandOutput[]);


  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedFilters, setSelectedFilters] = useState([] as ((typeof FILTERS)[number])[]);
  const [filterType, setFilterType] = useState("narrow" as "narrow" | "inclusive");
  const [commandNameFilter, setCommandNameFilter] = useState("");

  const updateSelectedFilters = (method: "add" | "remove", filter: typeof FILTERS[number]) => {
    if (method === "add") {
      setSelectedFilters((old) => ([...old, filter]));
    } else {
      setSelectedFilters((old) => {
        const index = old.indexOf(filter);
        old.splice(index, 1);
        return [...old];
      });
    }

  }

  const getCommandsFromStorage = () => {
    const storedCommands = CustomCommandStore.getAll();
    setCustomCommands(storedCommands);

  }

  useFocusEffect(useCallback(() => {
    getCommandsFromStorage();
  }, []));

  const createFilteredCommands = () => {

    // console.log(commandNameFilterOn, selectedFilters.length);
    console.log(commandNameFilter);
    if (selectedFilters.length < 1 && commandNameFilter.length < 1) return customCommands;

    const filteredCommands: CommandOutput[] = [];

    for (const cmd of customCommands) {
      console.log(cmd.name)
      if ((commandNameFilter !== "" && cmd.name.toLowerCase().includes(commandNameFilter))) {
        filteredCommands.push(cmd);
        continue;
      }
      if (!cmd.command) continue;
      if (selectedFilters.length < 1) continue;

      const mappedCommands = cmd.command.map(c => c.delay ? "Delay" : (DefaultCommandValueEnglish[c.transmitValue! - 1]));

      if (filterType === "inclusive") {
        for (const filter of selectedFilters) {
          if (mappedCommands.includes(filter)) {
            filteredCommands.push(cmd);
            break;
          }
        }
      } else if (filterType === "narrow") {
        let includesAll = false;
        for (let i = 0; i < selectedFilters.length; i++) {
          const filter = selectedFilters[i];
          if (!mappedCommands.includes(filter)) break;

          if (i === selectedFilters.length - 1) includesAll = true;
        }

        if (includesAll) filteredCommands.push(cmd);
      }

    }

    return filteredCommands;

  }

  const filteredCommands = createFilteredCommands();

  return (
    <View style={theme.container}>


      <HeaderWithBackButton
        backText={back}
        headerText="View Custom"
        headerTextStyle={theme.settingsHeaderText}
      />

      <View style={{
        height: "90%",
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
            onPress={() => setModifyType(ModifyType.CREATE)}
          >
            {
              ({ pressed }) =>
                // <Octicons name="diff-added" size={25} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                <IonIcons name="add" size={27} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
            }
          </Pressable>

          <View style={{ position: "relative", width: "80%" }}>
            <TextInput
              style={{
                height: 40,
                backgroundColor: colorTheme.backgroundSecondaryColor,
                paddingHorizontal: 40,
                paddingRight: 10,
                borderRadius: 100,
                color: colorTheme.textColor,
              }}
              onChangeText={(text) => setCommandNameFilter(text)}
              placeholderTextColor={colorTheme.disabledButtonColor}
              placeholder="Find command by name..."
            />
            <IonIcons name="search" size={20} color={colorTheme.textColor} style={{ position: "absolute", left: 12, top: 10, }} />
          </View>


          <Pressable
            hitSlop={10}
            onPress={() => bottomSheetRef.current?.expand()}
          >
            {
              ({ pressed }) =>
                <IonIcons name="filter-outline" size={25} color={pressed ? colorTheme.buttonColor : colorTheme.textColor} />
            }
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 16,
        }}>
          {
            filteredCommands.length > 1 ? filteredCommands.map(command => (
              <CustomCommand
                command={command}
                onEdit={() => { setModifyType(ModifyType.EDIT); setEditCommandName(command.name); }}
                onDelete={() => { CustomCommandStore.deleteCommand(command.name); getCommandsFromStorage(); }}
                key={command.name}
              />
            ))
              : <Text style={{ color: colorTheme.headerTextColor, fontSize: 22, fontFamily: "IBMPlexSans_700Bold" }}>
                No Commands Found
              </Text>
          }
        </ScrollView>
      </View>


      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enablePanDownToClose

        backgroundStyle={{
          backgroundColor: colorTheme.backgroundSecondaryColor,
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)"
        }}
        handleIndicatorStyle={{ backgroundColor: colorTheme.buttonTextColor }}
      >
        <BottomSheetView style={{
          flex: 1,
          padding: 36,
          paddingTop: 10,
          alignItems: 'center',
          justifyContent: "flex-start",
          rowGap: 10,
        }}

        >
          <View style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ textAlign: "left", color: colorTheme.headerTextColor, fontSize: 22, fontFamily: "IBMPlexSans_700Bold" }}>
              Filter by Command Type
            </Text>
            <Pressable
              hitSlop={10}
              onPress={() => bottomSheetRef.current?.close()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {
                ({ pressed }) =>
                  <IonIcons name="close-circle-outline" size={35} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
              }
            </Pressable>
          </View>


          <View style={{ marginVertical: 10, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", columnGap: 15, }}>
            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "50%" }}>

              <Text style={{ color: colorTheme.headerTextColor, fontSize: 17, fontFamily: "IBMPlexSans_500Medium" }}>
                Filters Narrow:
              </Text>

              {/* <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", columnGap: 7, }}> */}
              {/* <Text>Off</Text> */}
              <ToggleSwitch
                onColor={colorTheme.buttonColor}
                offColor={colorTheme.disabledButtonColor}
                isOn={filterType === "narrow"}
                size="medium"
                hitSlop={10}
                circleColor={colorTheme.buttonTextColor}
                onToggle={(isOn) => setFilterType(isOn ? "narrow" : "inclusive")}
              />
              {/* <Text>On</Text> */}
              {/* </View> */}
            </View>
            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "40%" }}>

              <Pressable
                style={{ width: "100%" }}
                onPress={() => setSelectedFilters([])}
              >
                {
                  ({ pressed }) => (
                    <Text style={{
                      textAlign: "right",
                      width: "100%",
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      textDecorationColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      textDecorationStyle: "solid",
                      textDecorationLine: "underline",
                      fontSize: 17,
                      fontFamily: "IBMPlexSans_500Medium"
                    }}>
                      Clear Filters
                    </Text>
                  )
                }
              </Pressable>

            </View>
          </View>


          <View style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", rowGap: 10, alignItems: "center", justifyContent: "space-between" }}>
            {
              FILTERS.map(filter => (
                <View key={filter} style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "42%" }}>
                  <Text style={{ color: colorTheme.textColor, fontSize: 17, fontFamily: "IBMPlexSans_500Medium" }}>
                    {
                      filter
                    }
                  </Text>

                  <Pressable
                    hitSlop={10}
                    onPress={() => updateSelectedFilters(selectedFilters.includes(filter) ? "remove" : "add", filter)}
                  >
                    {
                      ({ pressed }) =>
                        <IonIcons color={(pressed) ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} name={selectedFilters.includes(filter) ? "checkbox-outline" : "square-outline"} />
                    }
                  </Pressable>
                </View>
              ))
            }
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  )

}