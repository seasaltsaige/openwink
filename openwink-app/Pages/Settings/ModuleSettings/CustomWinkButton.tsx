import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import ToggleSwitch from "toggle-switch-react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import { CustomOEMButtonStore } from "../../../Storage";
import { Presses } from "../../../helper/Types";
import { ButtonBehaviors } from "../../../helper/Types";
import RangeSlider from "react-native-sticky-range-slider";
import { BehaviorEnum, countToEnglish, buttonBehaviorMap } from "../../../helper/Constants";
import { sleep } from "../../../helper/Functions";
import { HeaderWithBackButton } from "../../../Components";
import { TooltipHeader } from "../../../Components";


const MIN = 100;
const MAX = 750;

type CustomButtonAction = {
  behavior: BehaviorEnum | null;
  behaviorHumanReadable: ButtonBehaviors | null;
  presses: Presses;
};

export function CustomWinkButton() {

  const { colorTheme, theme } = useColorTheme();
  const { oemCustomButtonEnabled, setOEMButtonStatus, buttonDelay, updateButtonDelay, updateOEMButtonPresets } = useBLE();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [intervalTooltipVisible, setIntervalTooltipVisible] = useState(false);
  const [actionsTooltipVisible, setActionsTooltipVisible] = useState(false);
  const [intervalValue, setIntervalValue] = useState(500);


  // Note: Should only include actions for 2 presses to 10 presses. 1 press can NOT be changed.

  const [modalType, setModalType] = useState("" as "edit" | "create" | "view");
  const [modalVisible, setModalVisible] = useState(false);

  // const [actions, setActions] = useState([{ behavior: BehaviorEnum.LEFT_WAVE, presses: 2, behaviorHumanReadable: "Left Wave" }, { behavior: BehaviorEnum.LEFT_WAVE, presses: 3, behaviorHumanReadable: "Left Wave" }, { behavior: BehaviorEnum.LEFT_WAVE, presses: 4, behaviorHumanReadable: "Left Wave" }] as CustomButtonAction[]);
  const [actions, setActions] = useState([] as CustomButtonAction[])
  const [action, setAction] = useState({} as CustomButtonAction);

  const [min, setMin] = useState(buttonDelay);
  const [max, setMax] = useState(MAX);

  const { device, isScanning, isConnecting } = useBLE();

  const fetchActionsFromStorage = () => {
    const storedActions = CustomOEMButtonStore.getAll();
    if (storedActions !== null && storedActions.length > 0) {
      setActions(storedActions.map(action => ({
        behaviorHumanReadable: action.behavior,
        presses: action.numberPresses,
        behavior: buttonBehaviorMap[action.behavior],
      })).sort((a, b) => a.presses - b.presses));
    } else setActions([]);
  }

  const handleValueChange = useCallback((newLow: number, newHigh: number) => {
    setMin(newLow);
    setMax(newHigh);
  }, []);

  useFocusEffect(useCallback(() => {
    const setValue = CustomOEMButtonStore.getDelay();
    if (setValue !== null)
      setIntervalValue(setValue);

    fetchActionsFromStorage();
  }, []));

  const updateButtonAction = async (action: CustomButtonAction) => {
    await updateOEMButtonPresets(action.presses, action.behaviorHumanReadable!);
    fetchActionsFromStorage();
  }

  const deleteButtonAction = async (action: CustomButtonAction) => {
    const index = actions.findIndex(v => v.presses === action.presses);
    await updateOEMButtonPresets(action.presses, 0);
    // Loop from presses array location to end of array
    for (let i = index + 1; i < actions.length; i++) {
      const actionToUpdateFromDelete = actions[i];
      //   // Move action down 1 press location
      await updateOEMButtonPresets((actionToUpdateFromDelete.presses - 1) as Presses, actionToUpdateFromDelete.behaviorHumanReadable!);
      //   // Delete old location
      await updateOEMButtonPresets(actionToUpdateFromDelete.presses, 0);
      await sleep(50);
    }

    // Fetch from storate again
    await fetchActionsFromStorage();
  }

  return (
    <>
      <View style={theme.container}>
        <HeaderWithBackButton
          backText={backHumanReadable}
          headerText="Button"
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
              onColor={!device ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
              offColor={colorTheme.disabledButtonColor}
              isOn={oemCustomButtonEnabled}
              size="medium"
              hitSlop={10}
              disabled={!device}
              circleColor={colorTheme.buttonTextColor}
              onToggle={async (isOn) => await setOEMButtonStatus(isOn ? "enable" : "disable")}
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
              renderThumb={() => <View style={(!device || !oemCustomButtonEnabled) ? theme.rangeSliderThumbDisabled : theme.rangeSliderThumb} />}
              renderRailSelected={() => <View style={(!device || !oemCustomButtonEnabled) ? theme.rangeSliderRailSelectedDisabled : theme.rangeSliderRailSelected} />}
              renderRail={() => <View style={theme.rangeSliderRail} />}
              disableRange
              disabled={(!device || !oemCustomButtonEnabled)}
            />
          </View>

          <View style={theme.rangeSliderSubtextView}>
            <Text style={theme.rangeSliderSubtext}>Shorter</Text>
            <Text style={theme.rangeSliderSubtext}>Longer</Text>
          </View>

          <View style={theme.rangeSliderButtonsView}>
            {/* RESET */}
            <Pressable
              style={({ pressed }) => (!device || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!device || !oemCustomButtonEnabled)}
              onPress={() => { updateButtonDelay(500); setMin(500); }}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Reset Value
              </Text>
              <IonIcons size={22} name="reload-outline" color={colorTheme.textColor} />
            </Pressable>

            {/* SAVE */}
            <Pressable
              style={({ pressed }) => (!device || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!device || !oemCustomButtonEnabled)}
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

            <Pressable
              style={({ pressed }) => [(!device || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons, { columnGap: 15, width: "auto" }]}
              disabled={(!device || !oemCustomButtonEnabled)}
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
            </Pressable>

            <Pressable
              style={({ pressed }) => (!device || !oemCustomButtonEnabled || actions.length >= 8) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!device || !oemCustomButtonEnabled || actions.length >= 8)}
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
              <Text style={theme.rangeSliderButtonsText}>
                Create New
              </Text>
              <IonIcons size={22} name="create-outline" color={colorTheme.textColor} />
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
                        {countToEnglish[action.presses]}
                      </Text>
                    </View>
                    <View style={theme.buttonActionPressable}>
                      <Pressable
                        disabled={(!device || !oemCustomButtonEnabled)}
                        onPress={() => {
                          setModalType("edit");
                          setAction(action);
                          setModalVisible(true);
                        }}
                        hitSlop={5}
                      // key={action.behavior}
                      >
                        {
                          ({ pressed }) => (
                            <View style={theme.buttonActionPressableView}>
                              <Text style={[
                                theme.buttonActionPressableText,
                                {
                                  color: (!device || !oemCustomButtonEnabled) ?
                                    colorTheme.disabledButtonColor :
                                    pressed ? colorTheme.buttonColor :
                                      colorTheme.textColor
                                }]}>
                                Edit
                              </Text>
                              <IonIcons color={(!device || !oemCustomButtonEnabled) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.textColor} name="create-outline" size={16} />

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
      </View >


      <CustomButtonActionModal
        visible={modalVisible}
        close={() => setModalVisible(false)}
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

  const [selectedAction, setSelectedAction] = useState(null as null | Exclude<ButtonBehaviors, "Default Behavior">);

  useEffect(() => {
    if (props.action.behaviorHumanReadable !== "Default Behavior")
      setSelectedAction(props.action.behaviorHumanReadable);
  }, [props.action.behaviorHumanReadable])

  return (
    <Modal
      onRequestClose={() => props.close()}
      transparent
      animationType="fade"
      hardwareAccelerated
      visible={props.visible}
    >
      <View style={theme.modalBackground}>

        <View style={theme.modalContentContainer}>

          <View style={theme.modalHeaderContainer}>
            <Pressable style={theme.modalHeaderClose} onPress={() => props.close()}>
              {
                ({ pressed }) => (
                  <>
                    <IonIcons style={{ marginTop: 2, }} name="close-sharp" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={18} />

                    <Text style={[pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText, { fontSize: 15 }]}>
                      Close
                    </Text>
                  </>
                )
              }
            </Pressable>

            <Text style={theme.modalHeaderText}>
              {
                props.modalType === "create" ?
                  "Creating action for" :
                  props.modalType === "edit" ?
                    "Editing action for" :
                    "Viewing action for"}
              {" "}
              {countToEnglish[props.action.presses]
              }
            </Text>
          </View>


          {
            props.modalType === "view" ? (
              <Text style={theme.modalViewText}>
                Retractor Button
                <Text style={{ fontFamily: "SpaceGroteskBold", }}>
                  {" "}{countToEnglish[props.action.presses]}{" "}
                </Text>
                is set to
                {"\n"}
                <Text style={{ fontFamily: "SpaceGroteskBold", }}>
                  {props.action.behaviorHumanReadable}
                </Text>
              </Text>
            ) : (
              <View style={{ rowGap: 8, display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: "center", width: "100%", }}>
                {
                  Object.keys(buttonBehaviorMap)
                    .slice(1, Object.keys(buttonBehaviorMap).length).map((behavior) => (
                      <Pressable
                        style={({ pressed }) => (pressed || behavior === selectedAction) ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
                        onPress={() => setSelectedAction(behavior as Exclude<ButtonBehaviors, "Default Behavior">)}
                        key={behavior}
                      >

                        <View style={theme.mainLongButtonPressableView}>
                          <Text style={[theme.mainLongButtonPressableText, { fontSize: 15 }]}>
                            {behavior}
                          </Text>
                        </View>
                        <IonIcons size={20} color={colorTheme.textColor} name={behavior === selectedAction ? "checkmark-circle-outline" : "ellipse-outline"} style={theme.mainLongButtonPressableIcon} />



                      </Pressable>
                    ))
                }

                <View style={[theme.modalSettingsConfirmationButtonContainer, { marginTop: 15 }]}>
                  <Pressable
                    style={({ pressed }) => selectedAction === null ? theme.modalSettingsConfirmationButtonDisabled : (pressed) ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton}
                    onPress={() => {
                      props.update({
                        presses: props.action.presses,
                        behavior: buttonBehaviorMap[selectedAction!] as BehaviorEnum,
                        behaviorHumanReadable: selectedAction
                      });
                      props.close();
                    }}
                  >
                    <IonIcons name={props.modalType === "create" ? "create-outline" : "save-outline"} color={colorTheme.headerTextColor} size={17} />
                    <Text style={[theme.modalSettingsConfirmationButtonText, { fontSize: 17 }]}>
                      {props.modalType === "create" ? "Create Action" : "Save Action"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => (pressed) ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton}
                    onPress={props.close}
                  >
                    <Text style={[theme.modalSettingsConfirmationButtonText, { fontSize: 17 }]}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
                {
                  props.modalType === "edit" ? (
                    <Pressable
                      style={({ pressed }) => [(pressed) ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton, { marginVertical: 8 }]}
                      onPress={() => {
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
            )
          }


        </View>

      </View>
    </Modal>
  )
}