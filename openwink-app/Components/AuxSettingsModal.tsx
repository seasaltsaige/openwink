import { Modal, Pressable, Text, View } from "react-native";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { useColorTheme } from "../hooks/useColorTheme";
import { ButtonBehaviors, CommandOutput } from "../helper/Types";
import { AUX_ID, AUX_SWITCH_TYPE, AuxButtonStore, CustomCommandStore } from "../Storage";
import { SearchBarFilter } from "./SearchBarFilter";
import { useFocusEffect } from "@react-navigation/native";
import { Fragment, useCallback, useEffect, useState } from "react";
import { buttonBehaviorMap, DefaultCommandValueEnglish } from "../helper/Constants";
import IonIcons from "@expo/vector-icons/Ionicons";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import { InfoPageHeader } from "./InfoPageHeader";
import { TooltipHeader } from "./TooltipHeader";
import ToggleSwitch from "toggle-switch-react-native";

const auxCategories = ["Actions", "Config"] as const;

type AUX_SWITCH_SETTINGS = {
  switchType: AUX_SWITCH_TYPE, // todo: aux settings - switch / looping
  looping: boolean
};

interface IAuxSettingsModalProps {
  visible: boolean;
  setAux: (action: ButtonBehaviors | CommandOutput, settings: AUX_SWITCH_SETTINGS) => void;
  close: () => void;
  auxToDisplay: AUX_ID;
  initialValue: ButtonBehaviors | CommandOutput;
}

export function AuxSettingsModal({
  visible,
  setAux,
  auxToDisplay,
  close,
  initialValue,
}: IAuxSettingsModalProps) {

  const { colorTheme, theme } = useColorTheme();

  const [commands, setCommands] = useState<CommandOutput[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<CommandOutput[]>([]);

  const [selectedAction, setSelectedAction] = useState({} as CommandOutput);
  const [selectedCategory, setSelectedCategory] = useState("Actions" as typeof auxCategories[number]);

  const [switchType, setSwitchType] = useState(AUX_SWITCH_TYPE.LATCHING);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    const commandsFromStorage: CommandOutput[] = [];

    for (const behavior in buttonBehaviorMap) {
      if (behavior === "Default Behavior") continue;
      commandsFromStorage.push({
        name: behavior,
        command: undefined,
      });
    }

    const cmds = CustomCommandStore.getAll();
    for (const cmd of cmds) {
      commandsFromStorage.push(cmd);
    }

    for (const cmd of commandsFromStorage) {
      if (typeof initialValue === "string" && initialValue === cmd.name) setSelectedAction(cmd);
      else if (typeof initialValue === "object" && initialValue.name === cmd.name) setSelectedAction(cmd);
    }

    const loop = AuxButtonStore.getAuxButtonLoop(auxToDisplay);
    const type = AuxButtonStore.getAuxButtonType(auxToDisplay);

    setCommands(commandsFromStorage);
    setFilteredCommands(commandsFromStorage);
    setSelectedCategory("Actions");
    setLooping(loop);
    setSwitchType(type);
  }, [visible]);


  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={close}
    >
      <ModalBlurBackground>
        <View
          style={{
            width: "88%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
            rowGap: 19,
            height: "55%",
            minHeight: 400
          }}
        >

          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center",
              // marginBottom: 15,
            }}
          >
            Editing Aux Button {auxToDisplay === AUX_ID.AUX1 ? "One" : "Two"}
          </Text>


          <InfoPageHeader
            categories={auxCategories}
            initialValue="Actions"
            hiddenBorderColor={colorTheme.backgroundSecondaryColor}
            onSelect={(category) => setSelectedCategory(category)}
          />

          {
            selectedCategory === "Actions" ?
              <>
                <SearchBarFilter
                  useFilters={false}
                  filterables={commands}
                  searchFilterKey="name"
                  onFilterTextChange={() => { }}
                  onFilteredItemsUpdate={(filteredItems) =>
                    setFilteredCommands(filteredItems)
                  }
                  backgroundColor={colorTheme.backgroundPrimaryColor}
                  placeholderText="Find action by name..."
                />

                <View style={{
                  flex: 1,
                  width: "95%",
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                }}>

                  <ScrollView
                    contentContainerStyle={{
                      rowGap: 12,
                      alignItems: "center",
                      justifyContent: "flex-start",
                      width: "100%",
                      paddingHorizontal: 18,
                    }}
                  >
                    {
                      filteredCommands.map((cmd, i) => (
                        <Fragment
                          key={`${cmd.name}-${i}-cmd`}
                        >
                          <Pressable
                            style={{
                              width: "100%",
                            }}
                            hitSlop={10}
                            onPress={() => {
                              setSelectedAction(cmd);

                              if (!cmd.command)
                                setLooping(false);
                            }}
                          >
                            {
                              ({ pressed }) => (

                                <View
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontFamily: "IBMPlexSans_500Medium",
                                      fontSize: 18,
                                      color: pressed ? colorTheme.buttonColor : colorTheme.textColor,
                                    }}
                                  >
                                    {cmd.name}
                                  </Text>


                                  <IonIcons
                                    name={cmd.name === selectedAction.name ? "radio-button-on-outline" : "radio-button-off-outline"}
                                    size={22}
                                    color={pressed ? colorTheme.buttonColor : colorTheme.textColor}
                                    style={{ top: 1 }}
                                  />
                                </View>
                              )
                            }
                          </Pressable>
                          {
                            i !== (filteredCommands.length - 1) ? (
                              <View style={{ width: "100%", height: 1.5, borderRadius: 3, backgroundColor: `${colorTheme.disabledButtonColor}70` }} />
                            ) : <></>
                          }
                        </Fragment>
                      ))

                    }

                  </ScrollView>

                </View>
              </>
              :
              <>
                <View style={{
                  flex: 1,
                  width: "95%",
                  paddingHorizontal: 10,
                }}>

                  <ScrollView
                    contentContainerStyle={{
                      justifyContent: "flex-start",
                      width: "100%",
                      rowGap: 20,
                    }}
                  >
                    <View style={{
                      rowGap: 15,
                    }}>
                      <TooltipHeader
                        tooltipContent={
                          <Text style={theme.tooltipContainerText}>
                            Latching and momentary buttons both activate the sequence when switched on. When looping is enabled with a custom macro action, latching switches repeat the action until switched off, while momentary buttons require another press to stop it.
                          </Text>
                        }
                        tooltipTitle="Auxiliary Button Type"
                        titleStyle={{
                          fontSize: 18
                        }}

                      />
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-evenly"
                      }}>
                        <Text style={{
                          fontSize: 16.5,
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_700Bold",
                        }}>
                          Latching
                        </Text>

                        <ToggleSwitch
                          isOn={switchType === AUX_SWITCH_TYPE.MOMENTARY}
                          onToggle={(isOn) => setSwitchType(isOn ? AUX_SWITCH_TYPE.MOMENTARY : AUX_SWITCH_TYPE.LATCHING)}
                          onColor={colorTheme.buttonColor}
                          offColor={colorTheme.disabledButtonColor}
                          size="medium"
                          hitSlop={10}
                          circleColor={colorTheme.buttonTextColor}
                          labelStyle={theme.mainLongButtonPressableIcon}
                        />
                        <Text style={{
                          fontSize: 16.5,
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_700Bold",
                        }}>
                          Momentary
                        </Text>
                      </View>
                    </View>

                    <View style={{ width: "100%", height: 2, borderRadius: 10, backgroundColor: `${colorTheme.disabledButtonColor}80` }} />


                    <View style={{
                      rowGap: 15,
                    }}>
                      <TooltipHeader
                        tooltipContent={
                          <Text style={theme.tooltipContainerText}>
                            Macro looping is only compatible with custom macros. When enabled, the custom macro will loop continuously until cancelled.
                          </Text>
                        }
                        tooltipTitle="Macro Looping"
                        titleStyle={{
                          fontSize: 18
                        }}

                      />
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-evenly"
                      }}>
                        <Text style={{
                          fontSize: 16.5,
                          color: !selectedAction.command ? `${colorTheme.disabledButtonColor}80` : colorTheme.textColor,
                          fontFamily: "IBMPlexSans_700Bold",
                        }}>
                          Disabled
                        </Text>

                        <ToggleSwitch
                          isOn={looping}
                          onToggle={(isOn) => setLooping(isOn)}
                          onColor={!selectedAction.command ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
                          offColor={colorTheme.disabledButtonColor}
                          size="medium"
                          hitSlop={10}
                          disabled={!selectedAction.command}
                          circleColor={colorTheme.buttonTextColor}
                          labelStyle={theme.mainLongButtonPressableIcon}
                        />
                        <Text style={{
                          fontSize: 16.5,
                          color: !selectedAction.command ? `${colorTheme.disabledButtonColor}80` : colorTheme.textColor,
                          fontFamily: "IBMPlexSans_700Bold",
                        }}>
                          Enabled
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </>
          }


          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 8,
            marginBottom: 10,
          }}>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "60%",
                paddingVertical: 6,
                // paddingHorizontal: 20,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
              onPress={() => {
                if (!selectedAction.command)
                  setAux(selectedAction.name as ButtonBehaviors, { looping, switchType });
                else
                  setAux(selectedAction, { looping, switchType });
              }}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.headerTextColor,
                  }}
                >
                  Apply Action
                </Text>
              }
            </Pressable>

            <Pressable
              onPress={close}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    textDecorationLine: "underline"
                  }}
                >
                  Cancel
                </Text>
              }
            </Pressable>
          </View>

        </View>
      </ModalBlurBackground>
    </Modal>
  )
}