import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import { ScrollView } from "react-native-gesture-handler";

import { ButtonBehaviors, CommandOutput, CustomButtonAction } from "../helper/Types";
import { useColorTheme } from "../hooks/useColorTheme";
import { CustomButtonFrequencyStore, CustomCommandStore } from "../Storage";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { buttonBehaviorMap, countToEnglish } from "../helper/Constants";
import { InfoPageHeader } from "./InfoPageHeader";
import LinearGradient from "react-native-linear-gradient";


type CustomButtonActionModalProps = {
  visible: boolean;
  action: CustomButtonAction;
  modalType: "edit" | "create";
  close: () => void;
  update: (action: CustomButtonAction) => Promise<void>;
  delete: (action: CustomButtonAction) => Promise<void>;
}
const MODAL_CATEGORIES = ["Frequently Used", "Left", "Right", "Both", "Macros"] as const;
export function CustomButtonActionModal(props: CustomButtonActionModalProps) {
  const { colorTheme } = useColorTheme();

  const [selectedAction, setSelectedAction] = useState(null as null | Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput);
  const [selectedCategory, setSelectedCategory] = useState("" as typeof MODAL_CATEGORIES[number]);
  const [filteredActions, setFilteredActions] = useState(null as null | (Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput)[])

  useEffect(() => {

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
          setFilteredActions([...allActions.filter(act => act.includes("Wave") || act.includes("Sleepy")) as any[], ...CustomCommandStore.getAll()]);
          break;
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (props.action.behaviorHumanReadable !== "Default Behavior")
      if (props.action.customCommand)
        setSelectedAction(props.action.customCommand)
      else
        setSelectedAction(props.action.behaviorHumanReadable!);
  }, [props.action]);

  useEffect(() => {
    if (props.visible) {
      const frequents = CustomButtonFrequencyStore.getTopFive();
      const actions = frequents.map((data) => {
        const customCommand = CustomCommandStore.get(data.name);
        if (customCommand !== null) return customCommand;
        else return data.name;
      });
      setFilteredActions(actions as any[]);
    }
  }, [props.visible]);


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

    if (typeof selectedAction === "string") {
      props.update({
        presses: props.action.presses,
        behavior: buttonBehaviorMap[selectedAction],
        behaviorHumanReadable: selectedAction,
      });
    } else {
      props.update({
        presses: props.action.presses,
        customCommand: selectedAction,
      });
    }

    CustomButtonFrequencyStore.increment(selectedAction);
    props.close();
  }, [selectedAction]);

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
            width: "85%",
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
          />

          <View style={{
            flex: 1,
            marginVertical: 10,
            width: "80%",
            position: "relative",
            paddingHorizontal: 10,
            paddingTop: 5,
          }}>
            <LinearGradient
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              colors={[colorTheme.backgroundSecondaryColor, "transparent"]}
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: 25,
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
                    <>
                      <Pressable
                        key={typeof action === "string" ? `${action}-${i}` : `${action.name}-${i}`}
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
                          <View key={typeof action === "string" ? `view-${action}-${i}` : `view-${action.name}-${i}`} style={{ width: "100%", height: 1.5, borderRadius: 3, backgroundColor: `${colorTheme.disabledButtonColor}70` }} />
                        ) : <></>
                      }
                    </>
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

            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              colors={[colorTheme.backgroundSecondaryColor, "transparent"]}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 25,
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
                backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "60%",
                paddingVertical: 6,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
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
    </Modal>
  )
}