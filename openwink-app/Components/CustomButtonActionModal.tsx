import { Fragment, useCallback, useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { ScrollView } from "react-native-gesture-handler";

import { ButtonBehaviors, CommandOutput, CustomButtonAction } from "../helper/Types";
import { useColorTheme } from "../hooks/useColorTheme";
import { CustomButtonFrequencyStore, CustomCommandStore, CustomOEMButtonStore } from "../Storage";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { buttonBehaviorMap, countToEnglish } from "../helper/Constants";
import { InfoPageHeader } from "./InfoPageHeader";
import LinearGradient from "react-native-linear-gradient";
import Tooltip from "react-native-walkthrough-tooltip";
import ToggleSwitch from "toggle-switch-react-native";


type CustomButtonActionModalProps = {
  visible: boolean;
  action: CustomButtonAction;
  modalType: "edit" | "create";
  close: () => void;
  update: (action: CustomButtonAction) => void;
  delete: (action: CustomButtonAction) => void;
}
const MODAL_CATEGORIES = ["Frequently Used", "Left", "Right", "Both", "Macros"] as const;

export function CustomButtonActionModal(props: CustomButtonActionModalProps) {
  const { colorTheme, theme } = useColorTheme();

  const [selectedAction, setSelectedAction] = useState(null as null | Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput);
  const [selectedCategory, setSelectedCategory] = useState("" as typeof MODAL_CATEGORIES[number]);
  const [filteredActions, setFilteredActions] = useState(null as null | (Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput)[]);
  const [macroLoop, setMacroLoop] = useState(false);
  const [macroLoopTooltipOpen, setMacroLoopTooltipOpen] = useState(false);

  const canSave = selectedAction !== null;

  useEffect(() => {
    if (!selectedAction)
      setMacroLoop(false);

    if (selectedCategory === "Frequently Used") {
      const frequents = CustomButtonFrequencyStore.getTopFive();
      const actions = frequents.map((data) => {
        const customCommand = CustomCommandStore.get(data.name);
        if (customCommand !== null) return customCommand;
        else return data.name;
      });
      setFilteredActions(actions as any[]);
    } else {
      const allActions = Object.keys(buttonBehaviorMap).slice(1);
      switch (selectedCategory) {
        case "Left":
          // shh
          setFilteredActions(allActions.filter(act => act.startsWith("Left") && !act.includes("Wave")) as any[]);
          break;
        case "Right":
          setFilteredActions(allActions.filter(act => act.startsWith("Right") && !act.includes("Wave")) as any[]);
          break;
        case "Both":
          setFilteredActions(allActions.filter(act => act.startsWith("Both") && !act.includes("Wave")) as any[]);
          break;
        case "Macros":
          // Waves, sleepy eye, and customs
          const customs = CustomCommandStore.getAll();
          setFilteredActions([...allActions.filter(act => act.includes("Wave") || act.includes("Sleepy")) as any[], ...customs]);
          break;
      }
    }
  }, [selectedCategory, selectedAction]);

  useEffect(() => {
    if (typeof selectedAction === "string") setMacroLoop(false);
  }, [selectedAction]);

  useEffect(() => {
    // Don't run on close
    if (!props.visible) return;

    const looped = CustomOEMButtonStore.getLooping(props.action.presses);
    setMacroLoop(looped);

    if (props.action.behaviorHumanReadable !== "Default Behavior")
      if (props.action.customCommand)
        setSelectedAction(props.action.customCommand)
      else
        setSelectedAction(props.action.behaviorHumanReadable!);
    // Set category on open
    const act = props.action;

    if (act.behaviorHumanReadable) {
      if (act.behaviorHumanReadable.startsWith("Left") && !act.behaviorHumanReadable.includes("Wave"))
        setSelectedCategory("Left");
      else if (act.behaviorHumanReadable.startsWith("Right") && !act.behaviorHumanReadable.includes("Wave"))
        setSelectedCategory("Right");
      else if (act.behaviorHumanReadable.startsWith("Both") && !act.behaviorHumanReadable.includes("Wave"))
        setSelectedCategory("Both");
      else if (act.behaviorHumanReadable.includes("Wave") || act.behaviorHumanReadable.includes("Sleepy"))
        setSelectedCategory("Macros");
    } else if (act.customCommand)
      setSelectedCategory("Macros");
    else setSelectedCategory("Frequently Used");

  }, [props.action, props.visible]);


  const getBoxType = (action: Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput) => {
    if (typeof action === "string") {
      if (typeof selectedAction === "string") {
        if (action === selectedAction) return "radio-button-on-outline";
        else return "radio-button-off-outline";
      } else return "radio-button-off-outline";
    } else {
      if (typeof selectedAction !== "string") {
        if (action.name === selectedAction?.name) return "radio-button-on-outline";
        else return "radio-button-off-outline";
      } else return "radio-button-off-outline";
    }
  }

  const saveAction = useCallback(() => {
    if (selectedAction === null) return;

    // if (selectedAction)
    if (typeof selectedAction === "string") {
      props.update({
        presses: props.action.presses,
        behavior: buttonBehaviorMap[selectedAction],
        behaviorHumanReadable: selectedAction,
        looping: false,
      });
    } else {
      props.update({
        presses: props.action.presses,
        customCommand: selectedAction,
        looping: macroLoop,
      });
    }

    CustomButtonFrequencyStore.increment(selectedAction);
    props.close();
  }, [selectedAction, macroLoop]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={props.visible}
      onRequestClose={props.close}
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
            rowGap: 10,
            height: "52%",
          }}
        >
          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center",
              marginBottom: 15,
            }}
          >

            {
              props.modalType === "edit" ?
                "Editing" :
                "Creating"
            } {countToEnglish[props.action.presses]}

          </Text>

          {/* Sections: "Frequently Used", "Left", "Right", "Both", and "Macro/Custom" ??? */}
          <InfoPageHeader
            categories={MODAL_CATEGORIES}
            onSelect={(category) => setSelectedCategory(category)}
            hiddenBorderColor={colorTheme.backgroundSecondaryColor}
            initialValue={selectedCategory}
          />

          <View style={{
            flex: 1,
            marginVertical: 10,
            width: "95%",
            paddingHorizontal: 10,
            paddingTop: 5,
          }}>


            {
              selectedCategory === "Macros" ? (
                <View style={[theme.mainLongButtonPressableContainer, { backgroundColor: undefined, padding: 0, margin: 0, marginTop: -10, marginBottom: 10, }]}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      Macro Loop {macroLoop ? "Enabled" : "Disabled"}
                    </Text>

                    <Tooltip
                      isVisible={macroLoopTooltipOpen}
                      onClose={() => setMacroLoopTooltipOpen(false)}
                      content={
                        <Text style={theme.tooltipContainerText}>
                          Macro Loop mode is useful for continuous operation at meets or in similar situations. If enabled, when the button action is executed, the macro will run continuously, until cancelled by an additional button press.{"\n\n"}
                          Loop mode is only compatible with custom macros.
                        </Text>
                      }
                      closeOnBackgroundInteraction
                      closeOnContentInteraction
                      placement="bottom"
                      contentStyle={theme.tooltipContainer}
                    >
                      <Pressable
                        hitSlop={20}
                        onPress={() => setMacroLoopTooltipOpen(true)}
                      >
                        {
                          ({ pressed }) => (
                            <IonIcons style={theme.tooltipIcon} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={22} name="help-circle-outline" />
                          )
                        }
                      </Pressable>
                    </Tooltip>
                  </View>

                  <View style={theme.mainLongButtonPressableIcon}>
                    <ToggleSwitch
                      disabled={typeof selectedAction === "string"}
                      onColor={typeof selectedAction === "string" ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
                      offColor={colorTheme.disabledButtonColor}
                      isOn={macroLoop}
                      size="medium"
                      hitSlop={10}
                      circleColor={colorTheme.buttonTextColor}
                      onToggle={(isOn) => setMacroLoop(isOn)}
                      labelStyle={theme.mainLongButtonPressableIcon}
                    />
                  </View>

                </View>
              ) : <></>
            }


            <LinearGradient
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              colors={[colorTheme.backgroundSecondaryColor, "transparent"]}
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: 10,
                width: "100%",
                zIndex: 1000,
              }}
              pointerEvents="none"
            />

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
                filteredActions !== null ? (
                  filteredActions.map((action, i) => (
                    <Fragment
                      key={typeof action === "string" ? `${action}-${i}` : `${action.name}-${i}`}
                    >
                      <Pressable
                        onPress={() => setSelectedAction(action)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                        hitSlop={15}
                      >
                        {({ pressed }) => (
                          <>
                            <Text
                              style={{
                                fontFamily: "IBMPlexSans_500Medium",
                                fontSize: 18,
                                color: pressed ? colorTheme.buttonColor : colorTheme.textColor,
                              }}
                            >
                              {
                                typeof action === "string" ?
                                  action
                                  : action.name
                              }
                            </Text>
                            <IonIcons name={getBoxType(action)} color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={22} style={{ top: 1 }} />
                          </>
                        )}

                      </Pressable>
                      {
                        i !== (filteredActions.length - 1) ? (
                          <View style={{ width: "100%", height: 1.5, borderRadius: 3, backgroundColor: `${colorTheme.disabledButtonColor}70` }} />
                        ) : <></>
                      }
                    </Fragment>
                  ))
                ) : (
                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 15,
                  }}>
                    Something went wrong here...
                  </Text>
                )
              }

            </ScrollView>

            {/* Not sure about these gradients */}
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              colors={[colorTheme.backgroundSecondaryColor, "transparent"]}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 10,
                width: "100%",
                zIndex: 1000,
              }}
              pointerEvents="none"
            />
          </View>


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
                backgroundColor: !canSave ? colorTheme.disabledButtonColor : pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "60%",
                paddingVertical: 6,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
              disabled={!canSave}
              onPress={saveAction}
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
              onPress={() => props.close()}
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
    </Modal >
  )
}