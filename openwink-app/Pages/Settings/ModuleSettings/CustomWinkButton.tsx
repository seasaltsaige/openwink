import { useCallback, useEffect, useReducer, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import RangeSlider from "react-native-sticky-range-slider";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import ToggleSwitch from "toggle-switch-react-native";

import { CommandOutput, CustomCommandStore, CustomOEMButtonStore } from "../../../Storage";
import { ButtonBehaviors, Presses } from "../../../helper/Types";
import { BehaviorEnum, countToEnglish, buttonBehaviorMap } from "../../../helper/Constants";
import { sleep } from "../../../helper/Functions";
import { TooltipHeader, HeaderWithBackButton, ModalBlurBackground } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import Tooltip from "react-native-walkthrough-tooltip";
import { BlurView } from "expo-blur";

const MIN = 100;
const MAX = 750;

type CustomButtonAction = {
  customCommand?: CommandOutput,
  behavior?: BehaviorEnum | null;
  behaviorHumanReadable?: ButtonBehaviors | null;
  presses: Presses;
};

export function CustomWinkButton() {

  const { colorTheme, theme } = useColorTheme();
  const {
    oemCustomButtonEnabled,
    setOEMButtonStatus,
    headlightBypass,
    setOEMButtonHeadlightBypass,
    buttonDelay,
    updateButtonDelay,
    updateOEMButtonPresets
  } = useBleCommand();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [bypassToolTipOpen, setBypassToolTipOpen] = useState(false);

  // Note: Should only include actions for 2 presses to 10 presses. 1 press can NOT be changed.

  const [modalType, setModalType] = useState("" as "edit" | "create" | "view");
  const [modalVisible, setModalVisible] = useState(false);

  // const [actions, setActions] = useState([{ behavior: BehaviorEnum.LEFT_WAVE, presses: 2, behaviorHumanReadable: "Left Wave" }, { behavior: BehaviorEnum.LEFT_WAVE, presses: 3, behaviorHumanReadable: "Left Wave" }, { behavior: BehaviorEnum.LEFT_WAVE, presses: 4, behaviorHumanReadable: "Left Wave" }] as CustomButtonAction[]);
  const [actions, setActions] = useState([] as CustomButtonAction[])
  const [action, setAction] = useState({} as CustomButtonAction);

  const [min, setMin] = useState(buttonDelay);
  const [max, setMax] = useState(MAX);

  const { isConnected } = useBleConnection();

  const fetchActionsFromStorage = () => {
    const storedActions = CustomOEMButtonStore.getAll();
    if (storedActions !== null && storedActions.length > 0) {
      setActions(storedActions.map(action => {
        if (typeof action.behavior === "string")
          return {
            behaviorHumanReadable: action.behavior,
            presses: action.numberPresses,
            behavior: buttonBehaviorMap[action.behavior],
          }
        else
          return {
            customCommand: action.behavior,
            presses: action.numberPresses,
          }
      }).sort((a, b) => a.presses - b.presses));
    } else setActions([]);
  }

  const handleValueChange = useCallback((newLow: number, newHigh: number) => {
    setMin(newLow);
    setMax(newHigh);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchActionsFromStorage();
  }, []));

  const updateButtonAction = async (action: CustomButtonAction) => {
    if (action.customCommand) {
      await updateOEMButtonPresets(action.presses, action.customCommand)
    } else {
      await updateOEMButtonPresets(action.presses, action.behaviorHumanReadable!);
    }

    fetchActionsFromStorage();
  }

  const deleteButtonAction = async (action: CustomButtonAction) => {
    const index = actions.findIndex(v => v.presses === action.presses);
    // delete action at presses number
    await updateOEMButtonPresets(action.presses, 0);


    // Loop from presses array location to end of array
    for (let i = index + 1; i < actions.length; i++) {
      const actionToUpdateFromDelete = actions[i];
      //   // Move action down 1 press location
      await updateOEMButtonPresets(
        (actionToUpdateFromDelete.presses - 1) as Presses,

        actionToUpdateFromDelete.customCommand ?
          actionToUpdateFromDelete.customCommand :
          actionToUpdateFromDelete.behaviorHumanReadable!
      );
      //   // Delete old location
      await updateOEMButtonPresets(actionToUpdateFromDelete.presses, 0);
      await sleep(10);
    }

    // Fetch from storate again
    fetchActionsFromStorage();
  }

  return (
    <>
      <SafeAreaView style={theme.container}>
        <HeaderWithBackButton
          backText={backHumanReadable}
          headerText="Button"
          deviceStatus
        />

        {/* MAIN Custom Retractor Button Toggle */}
        <View style={theme.mainLongButtonPressableContainer}>

          <View style={theme.mainLongButtonPressableView}>
            <Text style={theme.mainLongButtonPressableText}>
              {oemCustomButtonEnabled ? "Disable" : "Enable"} Custom Button
            </Text>
          </View>

          <View style={theme.mainLongButtonPressableIcon}>
            <ToggleSwitch
              onColor={!isConnected ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
              offColor={colorTheme.disabledButtonColor}
              isOn={oemCustomButtonEnabled}
              size="medium"
              hitSlop={10}
              disabled={!isConnected}
              circleColor={colorTheme.buttonTextColor}
              onToggle={async (isOn) => await setOEMButtonStatus(isOn ? "enable" : "disable")}
              labelStyle={theme.mainLongButtonPressableIcon}
            />
          </View>
        </View>

        <View style={theme.mainLongButtonPressableContainer}>

          <View style={theme.mainLongButtonPressableView}>
            <Text style={theme.mainLongButtonPressableText}>
              {headlightBypass ? "Disable" : "Enable"} Headlights Bypass
            </Text>

            <Tooltip
              isVisible={bypassToolTipOpen}
              onClose={() => setBypassToolTipOpen(false)}
              content={
                <Text style={theme.tooltipContainerText}>
                  Bypass mode allows Custom Button Actions to be used while headlight lights are turned switched on.{"\n"}
                  Note: Single press actions will result in no movement
                </Text>
              }
              closeOnBackgroundInteraction
              closeOnContentInteraction
              placement="bottom"
              contentStyle={theme.tooltipContainer}
            >
              <Pressable
                hitSlop={20}
                onPress={() => setBypassToolTipOpen(true)}
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
              onColor={(!isConnected || !oemCustomButtonEnabled) ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
              offColor={colorTheme.disabledButtonColor}
              isOn={headlightBypass}
              size="medium"
              hitSlop={10}
              disabled={!isConnected || !oemCustomButtonEnabled}
              circleColor={colorTheme.buttonTextColor}
              onToggle={async (isOn) => await setOEMButtonHeadlightBypass(isOn)}
              labelStyle={theme.mainLongButtonPressableIcon}
            />
          </View>

        </View>

        <View style={theme.intervalInfoContainer}>
          {/* Press Interval */}
          <View style={theme.rangeSliderContainer}>

            {/* Press Interval */}
            <TooltipHeader
              tooltipContent={
                <Text style={theme.tooltipContainerText}>
                  Maximum time allowed between retractor button presses
                  before a sequence takes effect. Between 250ms and 500ms
                  is recommended.
                </Text>
              }
              tooltipTitle="Press Interval"
            />

            <RangeSlider
              style={theme.rangeSliderStyle}
              min={MIN}
              max={MAX}
              step={1}
              low={min}
              high={max}
              onValueChanged={handleValueChange}
              renderLowValue={(value) => (
                <Text style={theme.rangeSliderLowText}>
                  {value} ms
                </Text>
              )}
              renderThumb={() => <View style={(!isConnected || !oemCustomButtonEnabled) ? theme.rangeSliderThumbDisabled : theme.rangeSliderThumb} />}
              renderRailSelected={() => <View style={(!isConnected || !oemCustomButtonEnabled) ? theme.rangeSliderRailSelectedDisabled : theme.rangeSliderRailSelected} />}
              renderRail={() => <View style={theme.rangeSliderRail} />}
              disableRange
              disabled={(!isConnected || !oemCustomButtonEnabled)}
            />
          </View>

          <View style={theme.rangeSliderSubtextView}>
            <Text style={theme.rangeSliderSubtext}>Shorter</Text>
            <Text style={theme.rangeSliderSubtext}>Longer</Text>
          </View>

          <View style={theme.rangeSliderButtonsView}>
            {/* RESET */}
            <Pressable
              style={({ pressed }) => (!isConnected || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!isConnected || !oemCustomButtonEnabled)}
              onPress={() => { updateButtonDelay(500); setMin(500); }}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Reset Value
              </Text>
              <IonIcons size={22} name="reload-outline" color={colorTheme.textColor} />
            </Pressable>

            {/* SAVE */}
            <Pressable
              style={({ pressed }) => (!isConnected || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!isConnected || !oemCustomButtonEnabled)}
              onPress={() => updateButtonDelay(min)}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Save Value
              </Text>
              <IonIcons size={22} name="download-outline" color={colorTheme.textColor} />
            </Pressable>
          </View>

        </View>

        <View style={theme.intervalInfoContainer}>
          {/* Button Actions Tooltip */}
          <TooltipHeader
            tooltipContent={
              <Text style={theme.tooltipContainerText}>
                List of actions certain sequences of button presses will activate.
                The default single button press is unable to be adjusted due to saftey reasons.
              </Text>
            }
            tooltipTitle="Button Actions"
          />

          {/* SINGLE PRESS INFO + Create New */}
          <View style={theme.rangeSliderButtonsView}>

            {/* <Pressable
              style={({ pressed }) => [(!isConnected || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons, { columnGap: 15, width: "auto" }]}
              disabled={(!isConnected || !oemCustomButtonEnabled)}
              onPress={() => {
                setAction({
                  behavior: BehaviorEnum.DEFAULT,
                  behaviorHumanReadable: "Default Behavior",
                  presses: 1,
                });
                setModalType("view");
                setModalVisible(true);
              }}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Single Press
              </Text>
              <IonIcons size={22} name="ellipsis-horizontal" color={colorTheme.textColor} />
            </Pressable> */}

            <Pressable
              style={({ pressed }) => [
                (!isConnected || !oemCustomButtonEnabled || actions.length >= 8) ?
                  { backgroundColor: colorTheme.disabledButtonColor } :
                  pressed ?
                    { backgroundColor: colorTheme.buttonColor } :
                    { backgroundColor: colorTheme.backgroundSecondaryColor },
                {
                  width: "auto",
                  paddingVertical: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  paddingHorizontal: 15,
                  paddingLeft: 10,
                  columnGap: 10,
                }
              ]}
              disabled={(!isConnected || !oemCustomButtonEnabled || actions.length >= 8)}
              onPress={() => {
                setAction({
                  behavior: null,
                  behaviorHumanReadable: null,
                  presses: (actions.length > 0 ? actions[actions.length - 1].presses + 1 : 1) as Presses,
                });
                setModalType("create");
                setModalVisible(true);
              }}
            >
              <IonIcons style={{ marginTop: 2, }} size={22} name="add" color={colorTheme.textColor} />
              <Text style={theme.rangeSliderButtonsText}>
                Add Action
              </Text>
            </Pressable>

          </View>

          <View style={{ height: "60%" }}>
            <ScrollView
              contentContainerStyle={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                rowGap: 12,
              }}
            >

              {
                actions.map((action) => (
                  <View style={theme.mainLongButtonPressableContainer} key={action.presses}>
                    <View style={theme.mainLongButtonPressableView}>
                      <Text style={[theme.mainLongButtonPressableText, { fontSize: 16 }]}>
                        {
                          countToEnglish[action.presses]
                        }
                      </Text>
                    </View>
                    <View style={theme.buttonActionPressable}>
                      <Pressable
                        disabled={(!isConnected || !oemCustomButtonEnabled)}
                        onPress={() => {
                          setModalType("edit");
                          setAction(action);
                          setModalVisible(true);
                        }}
                        hitSlop={5}
                      >
                        {
                          ({ pressed }) => (
                            <View style={theme.buttonActionPressableView}>
                              <Text style={[
                                theme.buttonActionPressableText,
                                {
                                  color: (!isConnected || !oemCustomButtonEnabled) ?
                                    colorTheme.disabledButtonColor :
                                    pressed ? colorTheme.buttonColor :
                                      colorTheme.textColor
                                }]}>
                                Edit
                              </Text>
                              <IonIcons color={(!isConnected || !oemCustomButtonEnabled) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.textColor} name="create-outline" size={16} />

                            </View>
                          )
                        }
                      </Pressable>
                    </View>
                  </View>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </SafeAreaView >


      <CustomButtonActionModal
        visible={modalVisible}
        close={() => {
          setModalVisible(false);
          setAction({} as CustomButtonAction);
        }}
        modalType={modalType}
        update={updateButtonAction}
        delete={deleteButtonAction}
        action={action}
      />
    </>
  )

}


type CustomButtonActionModalProps = {
  visible: boolean;
  action: CustomButtonAction;
  modalType: "edit" | "create" | "view";
  close: () => void;
  update: (action: CustomButtonAction) => Promise<void>;
  delete: (action: CustomButtonAction) => Promise<void>;
}

function CustomButtonActionModal(props: CustomButtonActionModalProps) {
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