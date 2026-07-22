import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import RangeSlider from "react-native-sticky-range-slider";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import ToggleSwitch from "toggle-switch-react-native";

import { CustomOEMButtonStore } from "../../../Storage";
import { CustomButtonAction, Presses } from "../../../helper/Types";
import { countToEnglish, buttonBehaviorMap, BehaviorEnum } from "../../../helper/Constants";
import { sleep } from "../../../helper/Functions";
import { TooltipHeader, HeaderWithBackButton, CustomButtonActionModal, SettingsToolbar, UnsavedChangesModal } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import Tooltip from "react-native-walkthrough-tooltip";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";

const MIN = 100;
const MAX = 750;



export function CustomWinkButton() {

  const { colorTheme, theme } = useColorTheme();

  const {
    setOEMButtonStatus,
    setOEMButtonHeadlightBypass,
    updateButtonDelay,
    updateOEMButtonPresets
  } = useBleCommand();

  const {
    buttonDelay,
    headlightBypass,
    oemCustomButtonEnabled,
  } = useBleMonitor();

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [bypassToolTipOpen, setBypassToolTipOpen] = useState(false);

  const [modalType, setModalType] = useState("" as "edit" | "create");
  const [modalVisible, setModalVisible] = useState(false);

  const [actions, setActions] = useState([] as CustomButtonAction[]);
  const [storedActions, setStoredActions] = useState([] as CustomButtonAction[]);

  const [confirmationVisible, setConfirmationVisible] = useState(false);


  const [action, setAction] = useState({} as CustomButtonAction);

  const [min, setMin] = useState(buttonDelay);
  const [max, setMax] = useState(MAX);

  const { isConnected } = useBleConnection();
  // const isConnected = true;

  const checkActionsDiffer = useCallback(() => {
    if (storedActions.length !== actions.length) return true;

    for (let i = 0; i < storedActions.length; i++) {
      if (storedActions[i].behaviorHumanReadable !== actions[i].behaviorHumanReadable) return true;
      else if (storedActions[i].looping !== actions[i].looping) return true;
      else if (storedActions[i].customCommand && actions[i].customCommand && storedActions[i].customCommand?.name !== actions[i].customCommand?.name) return true;
    }

    return false;

  }, [storedActions, actions]);


  const hasUnsavedChanges = (
    buttonDelay !== min || checkActionsDiffer()
  );

  const fetchActionsFromStorage = () => {
    const storedActions = CustomOEMButtonStore.getAll();
    console.log(storedActions);
    if (storedActions !== null && storedActions.length > 0) {
      const acts = storedActions.sort((a, b) => a.presses - b.presses);
      setActions(acts);
      setStoredActions(acts);
    } else {
      setActions([]);
      setStoredActions([]);
    }
  }

  const handleValueChange = useCallback((newLow: number, newHigh: number) => {
    setMin(newLow);
    setMax(newHigh);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchActionsFromStorage();
  }, []));

  const updateButtonActionLocal = (action: CustomButtonAction) => {
    setActions((old) => {
      const newVals = old.toSpliced(action.presses - 1, 1, action);
      return newVals;
    });
  }

  const saveValues = useCallback(async () => {
    await updateButtonDelay(min);

    for (let i = 0; i < 9; i++) {
      if (i >= actions.length) {
        await updateOEMButtonPresets((i + 1) as Presses, null);
      } else {
        const btnAction = actions[i];
        await updateOEMButtonPresets(btnAction.presses, btnAction);
      }

      await sleep(20);
    }

    fetchActionsFromStorage();
  }, [actions, min]);

  const deleteButtonActionLocal = (action: CustomButtonAction) => {

    setActions((old) => {
      const newActions = old.toSpliced(action.presses - 1, 1);
      for (let i = 0; i < newActions.length; i++)
        newActions[i].presses = (i + 1) as Presses;

      return newActions;
    });
  }

  return (
    <>
      <SafeAreaView style={[theme.container, { rowGap: 10 }]}>
        <HeaderWithBackButton
          backText={backHumanReadable}
          pressAction={() => {
            if (hasUnsavedChanges) {
              setConfirmationVisible(true);
            } else
              navigation.goBack();
          }}
          headerText="Customize Retractor"
          deviceStatus
        />

        <View style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-evenly",
          rowGap: 15,
          marginTop: 10,
        }}>
          {/* MAIN Custom Retractor Button Toggle */}
          <View style={[theme.mainLongButtonPressableContainer, { backgroundColor: undefined, padding: 0, paddingVertical: 0, }]}>

            <View style={theme.mainLongButtonPressableView}>
              <Text style={theme.mainLongButtonPressableText}>
                Custom Button {oemCustomButtonEnabled ? "Enabled" : "Disabled"}
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

          {/* Bypass enable switch */}
          <View style={[theme.mainLongButtonPressableContainer, { backgroundColor: undefined, padding: 0, paddingVertical: 0, }]}>

            <View style={theme.mainLongButtonPressableView}>
              <Text style={theme.mainLongButtonPressableText}>
                Headlights Bypass {headlightBypass ? "Enabled" : "Disabled"}
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

        </View>

        <View style={[theme.intervalInfoContainer, { rowGap: 18 }]}>
          {/* Press Interval */}
          <View style={[theme.rangeSliderContainer, { rowGap: 15, }]}>

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

        </View>

        <View style={{
          alignItems: "center",
          rowGap: 10,
          marginBottom: 60,
          // backgroundColor: "pink",
          flex: 1,
        }}>
          {/* Button Actions Tooltip */}
          <View style={theme.intervalInfoContainer}>
            <TooltipHeader
              tooltipContent={
                <Text style={theme.tooltipContainerText}>
                  List of actions certain sequences of button presses will activate.
                  The default single button press is unable to be adjusted due to saftey reasons.
                </Text>
              }
              tooltipTitle="Button Actions"
            />
          </View>

          <View style={{
            flex: 1,
            alignItems: "center",
            rowGap: 10,
          }}>
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
                actions.length > 0 ?
                  actions.map((action) => (
                    <Pressable
                      style={({ pressed }) => [
                        theme.mainLongButtonPressableContainer, {
                          backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor
                        }
                      ]}
                      key={`${action.presses}-${action.customCommand ? action.customCommand.name : action.behaviorHumanReadable}`}
                      disabled={(!isConnected || !oemCustomButtonEnabled)}
                      onPress={() => {
                        setModalType("edit");
                        setAction(action);
                        setModalVisible(true);
                      }}

                    >
                      <View style={[theme.mainLongButtonPressableView, { flex: 1, justifyContent: "space-between" }]}>
                        <Text style={[theme.mainLongButtonPressableText, { fontSize: 16, flex: 1 }]}>
                          {
                            countToEnglish[action.presses]
                          }
                        </Text>

                        <Text style={[theme.mainLongButtonPressableText, {
                          fontSize: 16,
                          flex: 1,
                          color: `${colorTheme.disabledButtonColor}`,
                          marginRight: 15,
                          textAlign: "right",
                        }]}
                          numberOfLines={1}>
                          {
                            action.customCommand ? action.customCommand.name : action.behaviorHumanReadable
                          }
                        </Text>
                      </View>

                      <Pressable
                        disabled={(!isConnected || !oemCustomButtonEnabled)}
                        onPress={() => deleteButtonActionLocal(action)}
                        hitSlop={10}
                      >
                        {
                          ({ pressed }) => (

                            <IonIcons
                              color={(!isConnected || !oemCustomButtonEnabled) ?
                                colorTheme.disabledButtonColor :
                                pressed ?
                                  colorTheme.buttonColor :
                                  colorTheme.textColor}
                              name="close" size={21}
                              style={{
                                marginRight: 10,
                              }}
                            />
                          )
                        }
                      </Pressable>
                    </Pressable>
                    // </View>
                  ))
                  : (
                    <Text
                      style={{
                        fontSize: 19,
                        fontFamily: "IBMPlexSans_500Medium",
                        color: colorTheme.headerTextColor,
                        textAlign: "center"
                      }}
                    >
                      No Actions Created{"\n"}
                      <Text style={{ fontSize: 16 }}>
                        Create one now!
                      </Text>
                    </Text>
                  )
              }
            </ScrollView>

            <View style={{
              flexDirection: "row",
              alignItems: "center",
              columnGap: 10,
            }}>

              <IonIcons name="warning-outline" color={hasUnsavedChanges ? "#FFBF00E0" : colorTheme.backgroundPrimaryColor} size={16} style={{ marginTop: 2 }} />

              <Text style={{
                color: "#FFBF00E0",
                fontFamily: "IBMPlexSans_300Light",
                fontSize: 15
              }}>
                {
                  hasUnsavedChanges ? "Warning: Unsaved Changes" : ""
                }
              </Text>

            </View>

            {/* Create New */}
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: (!isConnected || !oemCustomButtonEnabled || actions.length >= 8) ?
                    colorTheme.disabledButtonColor :
                    pressed ?
                      colorTheme.buttonColor :
                      colorTheme.backgroundSecondaryColor,
                  paddingVertical: 10,
                  flexDirection: "row",
                  borderRadius: 8,
                  paddingHorizontal: 15,
                  columnGap: 10,
                }
              ]}
              disabled={(!isConnected || !oemCustomButtonEnabled || actions.length >= 8)}
              onPress={() => {
                setAction(
                  {
                    looping: false,
                    presses: (actions.length > 0 ? actions[actions.length - 1].presses + 1 : 1) as Presses,
                    behavior: null,
                    behaviorHumanReadable: null,
                    customCommand: undefined,
                  });
                setModalType("create");
                setModalVisible(true);
              }}
            >
              <Text style={theme.rangeSliderButtonsText}>
                Create New Action
              </Text>

              <IonIcons style={{ marginTop: 2, }} size={22} name="add" color={colorTheme.textColor} />
            </Pressable>

          </View>
        </View>


        <SettingsToolbar
          reset={() => {
            setMin(buttonDelay);
            fetchActionsFromStorage();
          }}
          resetText="Discard"
          save={saveValues}
          saveText="Save Changes"
          disabled={!isConnected || !hasUnsavedChanges}
        />

      </SafeAreaView>

      <CustomButtonActionModal
        visible={modalVisible}
        close={() => {
          setModalVisible(false);
          setAction({} as CustomButtonAction);
        }}
        modalType={modalType}
        update={updateButtonActionLocal}
        delete={deleteButtonActionLocal}
        action={action}
      />

      <UnsavedChangesModal
        cancel={() => setConfirmationVisible(false)}
        visible={confirmationVisible}
        discardChanges={() => {
          setMin(buttonDelay);
          fetchActionsFromStorage();
          navigation.goBack();
        }}
        saveChanges={async () => {
          await saveValues();
          navigation.goBack();
        }}
      />
    </>
  )

}