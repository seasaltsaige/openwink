import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBLE } from "../../hooks/useBLE";
import { CommandSequenceBottomSheet, HeaderWithBackButton, SearchBarFilter } from "../../Components";
import { CommandInput, CommandOutput, CustomCommandStore } from "../../Storage";
import { DefaultCommandValueEnglish } from "../../helper/Constants";
import BottomSheet from "@gorhom/bottom-sheet";
import IonIcons from "@expo/vector-icons/Ionicons";

const FILTERS = ["Delay", ...DefaultCommandValueEnglish] as const;
export function CustomCommands() {
  const { theme, colorTheme } = useColorTheme();
  const {
    device,
    customCommandActive,
    customCommandInterrupt,
    sendCustomCommand,
    headlightsBusy
  } = useBLE();

  const [commands, setCommands] = useState([] as CommandOutput[]);
  const [filteredCommands, setFilteredCommands] = useState([] as CommandOutput[]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [displayedCommand, setDisplayedCommand] = useState(null as CommandOutput | null);
  const [activeCommand, setActiveCommand] = useState(null as CommandOutput | null);
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  useFocusEffect(useCallback(() => {
    const commandsFromStorage = CustomCommandStore.getAll();
    setCommands(commandsFromStorage);
    setFilteredCommands(commandsFromStorage);
  }, []));


  const handleCommandInteraction = (command: CommandOutput, type: "start" | "stop") => {
    if (type === "stop") customCommandInterrupt();
    else {
      setActiveCommand(command);
      sendCustomCommand(command.command!);
    }
  }

  useEffect(() => {
    if (!customCommandActive.current && !headlightsBusy)
      setActiveCommand(null);
  }, [customCommandActive.current, headlightsBusy]);

  const canRunCommands = device && !customCommandActive.current;

  return (
    <View style={theme.container}>

      <HeaderWithBackButton
        backText={back}
        headerText="Run Custom"
        headerTextStyle={theme.settingsHeaderText}
        deviceStatus
      />

      <View style={theme.contentContainer}>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", width: "90%", columnGap: 15, marginTop: 10, }}>
          <SearchBarFilter
            filterables={commands}
            searchFilterKey="name"
            filters={FILTERS}
            onFilterTextChange={(text) => { }}
            onFilteredItemsUpdate={(filteredItems) => setFilteredCommands(filteredItems)}
            onFiltersChange={(filters) => { }}
            placeholderText="Find command by name..."
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
          />
        </View>

        <View style={{ height: "80%", width: "100%" }}>
          <ScrollView
            contentContainerStyle={{ width: "100%", alignItems: "center", rowGap: 14, }}
          >
            {
              filteredCommands.length > 0 ?
                filteredCommands.map((command) => (
                  <View
                    key={command.name}
                    style={theme.mainLongButtonPressableContainer}
                  >
                    <View style={theme.mainLongButtonPressableView}>
                      <Text style={[theme.mainLongButtonPressableText, {
                        color:
                          customCommandActive.current ? (
                            activeCommand && activeCommand.name === command.name ?
                              colorTheme.textColor : colorTheme.disabledButtonColor
                          ) : (
                            canRunCommands ? colorTheme.textColor
                              : colorTheme.disabledButtonColor
                          )

                      }]}>
                        {command.name}
                      </Text>

                    </View>
                    {/* </Pressable> */}

                    <View style={[theme.mainLongButtonPressableIcon, { flexDirection: "row", alignItems: "center", columnGap: 25 }]}>
                      <Pressable
                        onPress={() => { handleCommandInteraction(command, activeCommand?.name === command.name ? "stop" : "start"); }}
                        hitSlop={10}
                        disabled={
                          customCommandActive.current ? (
                            activeCommand && activeCommand.name === command.name ? false : true
                          ) : canRunCommands ? false : true
                        }
                      >
                        {
                          ({ pressed }) =>
                            <IonIcons name={
                              customCommandActive.current ? (
                                activeCommand && activeCommand.name === command.name ?
                                  "pause" : "play"
                              ) : "play"
                            } size={23} color={
                              customCommandActive.current ? (
                                activeCommand && activeCommand.name === command.name ?
                                  colorTheme.textColor : colorTheme.disabledButtonColor
                              ) : (
                                canRunCommands ? (
                                  pressed ? colorTheme.buttonColor : colorTheme.textColor
                                ) : colorTheme.disabledButtonColor
                              )
                            } />
                        }
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          if (command.name === displayedCommand?.name) {
                            setDisplayedCommand(null);
                            bottomSheetRef.current?.close();
                          } else {
                            setDisplayedCommand(command);
                            bottomSheetRef.current?.snapToIndex(0)
                          }
                        }}
                        hitSlop={10}
                      >
                        {
                          ({ pressed }) =>
                            <IonIcons name={command.name === displayedCommand?.name ? "eye-off-outline" : "eye-outline"} size={23} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                        }
                      </Pressable>
                    </View>
                  </View>
                ))
                : <Text style={{ color: colorTheme.headerTextColor, fontSize: 22, fontFamily: "IBMPlexSans_700Bold" }}>
                  No Commands Found
                </Text>
            }

          </ScrollView>
        </View>
      </View>

      <CommandSequenceBottomSheet
        bottomSheetRef={bottomSheetRef}
        command={displayedCommand!}
        close={() => { setDisplayedCommand(null); }}
      />

    </View>
  )
}