import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { ScrollView } from "react-native-gesture-handler";
import Tooltip from "react-native-walkthrough-tooltip";

import { ButtonBehaviors, CommandOutput, CustomButtonAction } from "../helper/Types";
import { useColorTheme } from "../hooks/useColorTheme";
import { CustomCommandStore } from "../Storage";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { BehaviorEnum, buttonBehaviorMap, countToEnglish } from "../helper/Constants";


type CustomButtonActionModalProps = {
  visible: boolean;
  action: CustomButtonAction;
  modalType: "edit" | "create" | "view";
  close: () => void;
  update: (action: CustomButtonAction) => Promise<void>;
  delete: (action: CustomButtonAction) => Promise<void>;
}

export function CustomButtonActionModal(props: CustomButtonActionModalProps) {
  const { theme, colorTheme } = useColorTheme();

  const [selectedAction, setSelectedAction] = useState(null as null | Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput);
  const [customCommands, setCustomCommands] = useState(CustomCommandStore.getAll());
  const [actionTooltipOpen, setActionTooltipOpen] = useState(false);

  useEffect(() => {
    if (props.action.behaviorHumanReadable !== "Default Behavior")
      if (props.action.customCommand)
        setSelectedAction(props.action.customCommand)
      else
        setSelectedAction(props.action.behaviorHumanReadable!);
  }, [props.action]);

  useEffect(() => {
    if (props.visible) {
      setCustomCommands(
        CustomCommandStore.getAll(),
      );
    }
  }, [props.visible]);

  return (
    <Modal
      onRequestClose={() => { props.close(); setSelectedAction(null); }}
      transparent
      animationType="fade"
      hardwareAccelerated
      visible={props.visible}
    >
      <ModalBlurBackground>
        <View style={[theme.modalContentContainer, { justifyContent: "flex-start" }]}>


          <View style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <Text
              style={{
                fontFamily: "IBMPlexSans_700Bold",
                color: colorTheme.headerTextColor,
                fontSize: 22,
                textAlign: "left"
              }}
            >
              {
                props.modalType === "create" ?
                  "Creating action for\n" :
                  props.modalType === "edit" ?
                    "Editing action for\n" :
                    "Viewing action for\n"}
              {countToEnglish[props.action.presses]
              }
            </Text>

            <Pressable
              hitSlop={10}
              onPress={props.close}
            >
              {
                ({ pressed }) => (
                  <IonIcons name="close-outline" size={25} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                )
              }
            </Pressable>
          </View>



          {(
            // Two column views, left column contains default actions
            // right column contains custom commands
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              height: 300,
              width: "100%",
            }}>

              <View style={{
                width: "45%",
                height: "100%",
                rowGap: 5,
              }}>

                <Text style={{
                  width: "100%",
                  textAlign: "center",
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_500Medium",
                  fontSize: 16,
                }}>
                  Single Action
                </Text>

                <ScrollView
                  contentContainerStyle={{
                    rowGap: 7,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: 'center',
                    justifyContent: "center",
                    width: "100%"
                  }}>
                  {
                    Object.keys(buttonBehaviorMap)
                      .slice(1, Object.keys(buttonBehaviorMap).length).map((behavior) => (
                        <Pressable
                          style={({ pressed }) =>
                            [
                              (pressed || behavior === selectedAction) ?
                                theme.mainLongButtonPressableContainerPressed :
                                theme.mainLongButtonPressableContainer,
                              {
                                paddingVertical: 6,
                                paddingHorizontal: 0,
                                width: "100%",
                                borderRadius: 5,
                              }
                            ]
                          }
                          onPress={() => setSelectedAction(behavior as Exclude<ButtonBehaviors, "Default Behavior">)}
                          key={behavior}
                        >

                          <View style={theme.mainLongButtonPressableView}>
                            <Text style={[theme.mainLongButtonPressableText, { fontSize: 13.5 }]}>
                              {behavior}
                            </Text>
                          </View>
                          <IonIcons size={18} color={colorTheme.textColor} name={behavior === selectedAction ? "checkmark-circle-outline" : "ellipse-outline"} style={theme.mainLongButtonPressableIcon} />



                        </Pressable>
                      ))
                  }
                </ScrollView>
              </View>

              <View style={{
                width: "45%",
                height: "100%",
                rowGap: 5,
              }}>

                <Tooltip
                  isVisible={actionTooltipOpen}
                  onClose={() => setActionTooltipOpen(false)}
                  content={
                    <Text style={theme.tooltipContainerText}>
                      Custom Commands can be assigned to button press sequences.{"\n"}To create a new custom command, navigate to the 'Create Custom Command' page on the Home Screen.
                    </Text>
                  }
                  closeOnBackgroundInteraction
                  closeOnContentInteraction
                  placement="bottom"
                  contentStyle={theme.tooltipContainer}
                >

                  <View style={{
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    flexDirection: "row",
                    width: "100%",
                  }}>

                    <Text style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                    }}>
                      Custom Actions
                    </Text>
                    <Pressable
                      hitSlop={18}
                      onPress={() => setActionTooltipOpen(true)}
                    >
                      {
                        ({ pressed }) => (
                          <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={21} name="help-circle-outline" />
                        )
                      }
                    </Pressable>
                  </View>
                </Tooltip>

                <ScrollView
                  contentContainerStyle={{
                    rowGap: 7,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: 'center',
                    justifyContent: "center",
                    width: "100%"
                  }}>

                  {
                    customCommands.length > 0 ? (
                      customCommands.map((cmd) => (
                        <Pressable
                          style={({ pressed }) =>
                            [
                              (pressed || (selectedAction && typeof selectedAction !== "string" && selectedAction.name === cmd.name)) ?
                                theme.mainLongButtonPressableContainerPressed :
                                theme.mainLongButtonPressableContainer,
                              {
                                paddingVertical: 6,
                                paddingHorizontal: 0,
                                width: "100%",
                                borderRadius: 5,
                              }
                            ]
                          }
                          onPress={() => setSelectedAction(cmd)}
                          key={cmd.name}
                        >

                          <View style={theme.mainLongButtonPressableView}>
                            <Text style={[theme.mainLongButtonPressableText, { fontSize: 13.5 }]}>
                              {cmd.name.length > 15 ? `${cmd.name.slice(0, 13)}...` : cmd.name}
                            </Text>
                          </View>
                          <IonIcons size={18} color={colorTheme.textColor} name={(selectedAction && typeof selectedAction !== "string" && selectedAction.name === cmd.name) ? "checkmark-circle-outline" : "ellipse-outline"} style={theme.mainLongButtonPressableIcon} />
                        </Pressable>
                      ))
                    )
                      :
                      <Text style={{
                        color: colorTheme.textColor,
                        fontFamily: "IBMPlexSans_500Medium"
                      }}>
                        No Actions Available
                      </Text>

                  }

                </ScrollView>

              </View>

            </View>
          )
          }


          <View style={[theme.modalSettingsConfirmationButtonContainer]}>
            <Pressable
              style={({ pressed }) => selectedAction === null ? theme.modalSettingsConfirmationButtonDisabled : (pressed) ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton}
              onPress={() => {
                if (typeof selectedAction === "object")
                  props.update({
                    customCommand: selectedAction!,
                    presses: props.action.presses,
                  });
                else
                  props.update({
                    presses: props.action.presses,
                    behavior: buttonBehaviorMap[selectedAction!] as BehaviorEnum,
                    behaviorHumanReadable: selectedAction
                  });

                props.close();
              }}
            >
              <IonIcons name={props.modalType === "create" ? "sparkles-outline" : "sparkles-outline"} color={colorTheme.headerTextColor} size={17} />
              <Text style={[theme.modalSettingsConfirmationButtonText, { fontSize: 17 }]}>
                {props.modalType === "create" ? "Create Action" : "Save Action"}
              </Text>
            </Pressable>
            {
              props.modalType === "edit" ? (
                <Pressable
                  style={({ pressed }) => [(pressed) ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton, { marginVertical: 8 }]}
                  onPress={() => {
                    if (typeof selectedAction === "object")
                      props.delete({
                        customCommand: selectedAction!,
                        presses: props.action.presses
                      });
                    else
                      props.delete({
                        presses: props.action.presses,
                        behavior: buttonBehaviorMap[selectedAction!] as BehaviorEnum,
                        behaviorHumanReadable: selectedAction
                      });

                    props.close();
                  }}
                >
                  <IonIcons name={"trash-outline"} color={colorTheme.headerTextColor} size={17} />
                  <Text style={[theme.modalSettingsConfirmationButtonText, { fontSize: 17 }]}>
                    Delete Action
                  </Text>
                </Pressable>
              ) : <></>

            }
          </View>


        </View>

      </ModalBlurBackground>
    </Modal>
  )
}