import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import ToggleSwitch from "toggle-switch-react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import { buttonBehaviorMap, buttonBehaviorMapReversed, CustomOEMButtonStore, Presses } from "../../../Storage";
import DisabledConnection from "../../../Components/DisabledConnection";
import { ButtonBehaviors } from "../../../helper/Types";
import RangeSlider from "react-native-sticky-range-slider";
import { BehaviorEnum, countToEnglish } from "../../../helper/Constants";


const MIN = 100;
const MAX = 750;

type CustomButtonAction = {
  behavior: BehaviorEnum | null;
  behaviorHumanReadable: ButtonBehaviors | null;
  presses: Presses;
};

export function CustomWinkButton() {

  const { colorTheme, theme } = useColorTheme();
  const { oemCustomButtonEnabled, setOEMButtonStatus, buttonDelay, updateButtonDelay } = useBLE();
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

  const [actions, setActions] = useState([] as CustomButtonAction[]);
  const [action, setAction] = useState({} as CustomButtonAction);

  const [min, setMin] = useState(buttonDelay);
  const [max, setMax] = useState(MAX);

  const { device, isScanning, isConnecting } = useBLE();

  const fetchActionsFromStorage = async () => {
    const storedActions = await CustomOEMButtonStore.getAll();
    if (storedActions !== null && storedActions.length > 0) {
      setActions(storedActions.map(action => ({
        behaviorHumanReadable: action.behavior,
        presses: action.numberPresses,
        behavior: buttonBehaviorMap[action.behavior],
      })).sort((a, b) => a.presses - b.presses));
    }
  }

  const handleValueChange = useCallback((newLow: number, newHigh: number) => {
    setMin(newLow);
    setMax(newHigh);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const setValue = await CustomOEMButtonStore.getDelay();
        if (setValue !== null)
          setIntervalValue(setValue);

        await fetchActionsFromStorage();
      })();
    }, []),
  );

  return (
    <>
      <View style={theme.container}>

        <View style={theme.headerContainer}>

          <Pressable style={theme.backButtonContainer} onPress={() => navigation.goBack()}>
            {
              ({ pressed }) => (
                <>
                  <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                  <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>
                    {backHumanReadable}
                  </Text>

                  {
                    device ?
                      <IonIcons style={theme.backButtonContainerIcon} name="wifi-outline" color="#367024" size={21} /> :
                      (isConnecting || isScanning) ?
                        <ActivityIndicator style={theme.backButtonContainerIcon} color={colorTheme.buttonColor} /> :
                        <IonIcons style={theme.backButtonContainerIcon} name="cloud-offline-outline" color="#b3b3b3" size={23} />
                  }
                </>
              )
            }
          </Pressable>


          <Text style={theme.subSettingHeaderText}>
            Button
          </Text>

        </View>

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
            <Tooltip
              isVisible={intervalTooltipVisible}
              closeOnBackgroundInteraction
              closeOnContentInteraction
              placement="bottom"
              onClose={() => setIntervalTooltipVisible(false)}
              contentStyle={theme.tooltipContainer}
              content={
                <Text style={theme.tooltipContainerText}>
                  Maximum time allowed between retractor button presses
                  before a sequence takes effect. Between 250ms and 500ms
                  is recommended.
                </Text>
              }
            >
              <View style={theme.tooltipContainerView}>
                <Text style={theme.tooltipText}>
                  Press Interval
                </Text>

                <Pressable
                  hitSlop={20}
                  onPress={() => setIntervalTooltipVisible(true)}
                >
                  {
                    ({ pressed }) => (
                      <IonIcons style={theme.tooltipIcon} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
                    )
                  }
                </Pressable>
              </View>
            </Tooltip>

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
          <Tooltip
            isVisible={actionsTooltipVisible}
            closeOnBackgroundInteraction
            closeOnContentInteraction
            placement="bottom"
            onClose={() => setActionsTooltipVisible(false)}
            contentStyle={theme.tooltipContainer}
            content={
              <Text style={theme.tooltipContainerText}>
                List of actions certain sequences of button presses will activate.
                The default single button press is unable to be adjusted due to saftey reasons.
              </Text>
            }
          >

            <View style={theme.tooltipContainerView}>
              <Text style={theme.tooltipText}>
                Button Actions
              </Text>

              <Pressable
                hitSlop={20}
                onPress={() => setActionsTooltipVisible(true)}
              >
                {
                  ({ pressed }) => (
                    <IonIcons style={theme.tooltipIcon} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
                  )
                }
              </Pressable>
            </View>
          </Tooltip>

          {/* SINGLE PRESS INFO + Create New */}
          <View style={theme.rangeSliderButtonsView}>

            <Pressable
              style={({ pressed }) => [pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons, { columnGap: 15, width: "auto" }]}
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
              style={({ pressed }) => (!device || !oemCustomButtonEnabled || actions.length > 8) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!device || !oemCustomButtonEnabled || actions.length > 8)}
              onPress={() => {
                setAction({
                  behavior: null,
                  behaviorHumanReadable: null,
                  presses: (actions.length > 0 ? actions[actions.length - 1].presses + 1 : 2) as Presses,
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

          <ScrollView>
            {/* TODO: Add list view of custom actions (1-10), along with button to add new action, (each action has edit/remove option) */}
          </ScrollView>

        </View>
      </View >


      <CustomButtonActionModal
        visible={modalVisible}
        close={() => setModalVisible(false)}
        // createAction={() => { }}
        modalType={modalType}
        saveAction={() => { }}
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
  saveAction: () => void;
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
              {countToEnglish[props.action.presses - 1]
              }
            </Text>
          </View>


          {
            props.modalType === "view" ? (
              <Text style={{

              }}>

              </Text>
            ) : (
              <View style={{ rowGap: 8, display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: "center", width: "100%", }}>
                {
                  Object.keys(buttonBehaviorMap)
                    .slice(1, Object.keys(buttonBehaviorMap).length).map((behavior) => (
                      <Pressable
                        style={({ pressed }) => (pressed || behavior === selectedAction) ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
                        onPress={() => setSelectedAction(behavior as Exclude<ButtonBehaviors, "Default Behavior">)}
                      >

                        <View style={theme.mainLongButtonPressableView}>
                          <Text style={[theme.mainLongButtonPressableText, { fontSize: 13 }]}>
                            {behavior}
                          </Text>
                        </View>
                        <IonIcons size={18} color={colorTheme.textColor} name={behavior === selectedAction ? "checkmark-circle-outline" : "ellipse-outline"} style={theme.mainLongButtonPressableIcon} />



                      </Pressable>
                    ))
                }
              </View>
            )
          }


        </View>

      </View>
    </Modal>
  )
}