import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import ToggleSwitch from "toggle-switch-react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import { CustomOEMButtonStore } from "../../../Storage";
import DisabledConnection from "../../../Components/DisabledConnection";
import { ButtonBehaviors } from "../../../helper/Types";
import RangeSlider from "react-native-sticky-range-slider";


const MIN = 100;
const MAX = 750;

type CustomButtonAction = {
  behavior: number;
  behaviorHumanReadable: ButtonBehaviors;
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
  const [actions, setActions] = useState([] as CustomButtonAction[]);
  const [actionToEdit, setActionToEdit] = useState(null as null | {
    behavior: number;
    behaviorHumanReadable: ButtonBehaviors;
    numPresses: number;
  });
  const [modalType, setModalType] = useState("" as "edit" | "create");
  const [modalVisible, setModalVisible] = useState(false);
  const [min, setMin] = useState(buttonDelay);
  const [max, setMax] = useState(MAX);

  const { device, isScanning, isConnecting } = useBLE();

  const saveInterval = async () => {
    await updateButtonDelay(intervalValue);
  }

  const fetchActionsFromStorage = async () => {
    const storedActions = await CustomOEMButtonStore.getAll();

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
                      <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
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
              <IonIcons size={22} name="reload-outline" color={colorTheme.buttonTextColor} />
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
              <IonIcons size={22} name="download-outline" color={colorTheme.buttonTextColor} />
            </Pressable>
          </View>


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
                    <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
                  )
                }
              </Pressable>
            </View>
          </Tooltip>

          {/* SINGLE PRESS INFO + Create New */}
          <View style={theme.rangeSliderButtonsView}>

            <Pressable
              style={({ pressed }) => [pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons, { columnGap: 15, width: "auto" }]}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Single Press
              </Text>
              <IonIcons size={22} name="ellipsis-horizontal" color={colorTheme.buttonTextColor} />
            </Pressable>

            <Pressable
              style={({ pressed }) => (!device || !oemCustomButtonEnabled) ? theme.rangeSliderButtonsDisabled : pressed ? theme.rangeSliderButtonsPressed : theme.rangeSliderButtons}
              disabled={(!device || !oemCustomButtonEnabled)}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Create New
              </Text>
              <IonIcons size={22} name="create-outline" color={colorTheme.buttonTextColor} />
            </Pressable>

          </View>

          <ScrollView>
            {/* TODO: Add list view of custom actions (1-10), along with button to add new action, (each action has edit/remove option) */}
          </ScrollView>
        </View>
      </View >


      {/* <CustomButtonActionModal
        modalType={modalType}
        visible={modalVisible && device !== null}
        close={() => { setModalVisible(false); }}
        action={ }
        humanReadable={ }
        numPresses={ }
      /> */}
    </>
  )

}



function CustomButtonActionModal({ action, close, humanReadable, numPresses, modalType, visible }: {
  action: number;
  numPresses: number;
  humanReadable: ButtonBehaviors;
  modalType: "create" | "edit";
  visible: boolean;
  close: () => void;
}) {
  const { device, } = useBLE();
  const { colorTheme, theme } = useColorTheme();

  const onCreate = async () => { };
  const onUpdate = async () => { };
  const onDelete = async () => { };


  return (
    <Modal
      visible={visible}
      onRequestClose={() => close()}
      animationType="fade"
      hardwareAccelerated
      transparent={true}
    >

      <View style={theme.modalBackground}>

        <View
          style={{
            backgroundColor: colorTheme.backgroundPrimaryColor,
            width: "70%",
            shadowColor: "black",
            shadowOffset: { height: 2, width: 2 },
            shadowOpacity: 1,
            shadowRadius: 5,
            boxShadow: "black",
            elevation: 10,
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            rowGap: 10,
            padding: 15,
          }}>

          {
            modalType === "create" ? (
              <></>
            )
              : (
                <>
                </>
              )
          }

        </View>

      </View>

    </Modal>
  )
}