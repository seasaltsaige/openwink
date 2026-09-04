import { SafeAreaView } from "react-native-safe-area-context";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { AuxSettingsModal, HeaderWithBackButton, SettingsToolbar, UnsavedChangesModal } from "../../../Components";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import ToggleSwitch from "toggle-switch-react-native";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import Tooltip from "react-native-walkthrough-tooltip";
import IonIcons from "@expo/vector-icons/Ionicons";
import { AUX_ID, AUX_SWITCH_TYPE, CustomCommandStore } from "../../../Storage";



export function AuxButtons() {
  const { theme, colorTheme } = useColorTheme();
  const route = useRoute();

  const { isConnected } = useBleConnection();
  // const isConnected = true;
  // const auxiliaryButtonsEnabled = true;
  const { auxiliaryButtonsEnabled, aux1Action, aux2Action, aux1Loop, aux2Loop, aux1Type, aux2Type } = useBleMonitor();
  const { setAuxButton, setAuxiliaryButtonStatus } = useBleCommand();

  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [auxTooltipOpen, setAuxTooltipOpen] = useState(false);
  const [aux1, setAux1] = useState(aux1Action);
  const [aux2, setAux2] = useState(aux2Action);

  const [loop1, setLoop1] = useState(aux1Loop);
  const [loop2, setLoop2] = useState(aux2Loop);

  const [type1, setType1] = useState(aux1Type);
  const [type2, setType2] = useState(aux2Type);

  const [auxModalOpen, setAuxModalOpen] = useState(false);
  const [auxToDisplay, setAuxToDisplay] = useState(AUX_ID.AUX1 as AUX_ID);

  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);

  const updateAuxAction = useCallback(async () => {
    await setAuxButton(AUX_ID.AUX1, aux1, loop1, type1);
    await setAuxButton(AUX_ID.AUX2, aux2, loop2, type2);
  }, [aux1, aux2, loop1, loop2, type1, type2]);

  const resetAuxActions = async () => {
    await setAuxButton(AUX_ID.AUX1, "Left Wink", false, AUX_SWITCH_TYPE.LATCHING);
    await setAuxButton(AUX_ID.AUX2, "Right Wink", false, AUX_SWITCH_TYPE.LATCHING);
    setAux1("Left Wink");
    setAux2("Right Wink");
    setLoop1(false);
    setLoop2(false);
    setType1(AUX_SWITCH_TYPE.LATCHING);
    setType2(AUX_SWITCH_TYPE.LATCHING);
  }


  const auxData = [
    {
      id: AUX_ID.AUX1,
      action: aux1,
      looping: loop1,
      type: type1,
      name: "Auxiliary Button #1"
    },
    {
      id: AUX_ID.AUX2,
      action: aux2,
      looping: loop2,
      type: type2,
      name: "Auxiliary Button #2"
    }
  ];


  const unsavedAux1 = (() => {
    if (loop1 !== aux1Loop || type1 !== aux1Type) return true;

    // if both strings, and they dont match
    if (typeof aux1 === "string" && typeof aux1Action === "string" && aux1 !== aux1Action) return true;
    // if theyre different types
    else if ((typeof aux1 === "string" && typeof aux1Action === "object") || (typeof aux1 === "object" && typeof aux1Action === "string")) return true;
    // if theyre both objects, and the names dont match
    else if ((typeof aux1 === "object" && typeof aux1Action === "object") && aux1.name !== aux1Action.name) return true;

    else return false;
  })();

  const unsavedAux2 = (() => {
    if (loop2 !== aux2Loop || type2 !== aux2Type) return true;

    // if both strings, and they dont match
    if (typeof aux2 === "string" && typeof aux2Action === "string" && aux2 !== aux2Action) return true;
    // if theyre different types
    else if ((typeof aux2 === "string" && typeof aux2Action === "object") || (typeof aux2 === "object" && typeof aux2Action === "string")) return true;
    // if theyre both objects, and the names dont match
    else if ((typeof aux2 === "object" && typeof aux2Action === "object") && aux2.name !== aux2Action.name) return true;

    else return false;
  })();

  const navigation = useNavigation();
  const backWithSaveChanges = () => {
    if (unsavedAux1 || unsavedAux2) {
      setUnsavedChangesModalOpen(true);
      return;
    } else
      navigation.goBack();
  }

  return (
    <>
      <SafeAreaView style={[theme.container, { rowGap: 20 }]}>
        <HeaderWithBackButton
          backText={backHumanReadable}
          headerText="Auxiliary Buttons"
          deviceStatus
          pressAction={backWithSaveChanges}
        />
        <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>

          <View style={[theme.mainLongButtonPressableContainer, { backgroundColor: undefined, padding: 0 }]}>

            <View style={theme.mainLongButtonPressableView}>
              <Text style={theme.mainLongButtonPressableText}>
                Auxiliary Buttons {auxiliaryButtonsEnabled ? "Enabled" : "Disabled"}
              </Text>

              <Tooltip
                isVisible={auxTooltipOpen}
                onClose={() => setAuxTooltipOpen(false)}
                content={
                  <Text style={theme.tooltipContainerText}>
                    Auxiliary Buttons are additional buttons that can be routed anywhere in the car, allowing quick access to commonly used actions. When enabled, the actions and behaviors programmed below will take affect. While disabled, auxiliary button actions will not function.
                  </Text>
                }
                closeOnBackgroundInteraction
                closeOnContentInteraction
                placement="bottom"
                contentStyle={theme.tooltipContainer}
              >
                <Pressable
                  hitSlop={20}
                  onPress={() => setAuxTooltipOpen(true)}
                >
                  {
                    ({ pressed }) => (
                      <IonIcons style={{ marginTop: 2 }} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={22} name="help-circle-outline" />
                    )
                  }
                </Pressable>
              </Tooltip>
            </View>

            <View style={theme.mainLongButtonPressableIcon}>
              <ToggleSwitch
                onColor={(!isConnected) ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
                offColor={colorTheme.disabledButtonColor}
                isOn={auxiliaryButtonsEnabled}
                size="medium"
                hitSlop={10}
                disabled={!isConnected}
                circleColor={colorTheme.buttonTextColor}
                onToggle={async (isOn) => await setAuxiliaryButtonStatus(isOn)}
                labelStyle={theme.mainLongButtonPressableIcon}
              />
            </View>
          </View>


        </View>


        {
          auxData.map((aux) => (
            <View
              key={`${aux.id}-${aux.name}`}
              style={{
                backgroundColor: colorTheme.backgroundSecondaryColor,
                width: "95%",
                borderRadius: 10,
                flexDirection: "column",
                alignItems: "center",
                padding: 5,
                paddingTop: 10,
                paddingBottom: 15,
                rowGap: 17,
                marginBottom: 10,
              }}>

              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "95%",
                paddingLeft: 5
              }}>
                <Text style={{
                  color: colorTheme.headerTextColor,
                  fontSize: 18,
                  fontFamily: "IBMPlexSans_700Bold",
                  textAlign: "center",
                }}>
                  {aux.name}
                </Text>

                <Pressable
                  disabled={!isConnected || !auxiliaryButtonsEnabled}
                  style={{
                    marginTop: 2
                  }}
                  onPress={() => { setAuxToDisplay(aux.id); setAuxModalOpen(true); }}
                >
                  {
                    ({ pressed }) => (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", columnGap: 5 }}>
                        <Text style={{
                          color: (!isConnected || !auxiliaryButtonsEnabled) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.textColor,
                          fontSize: 16,
                          fontFamily: "IBMPlexSans_500Medium",
                          textAlign: "center",
                        }}>
                          Edit
                        </Text>
                        <IonIcons style={{ marginTop: 2 }} name="chevron-forward" size={20} color={(!isConnected || !auxiliaryButtonsEnabled) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.textColor} />
                      </View>
                    )
                  }
                </Pressable>
              </View>

              <View style={{ width: "90%", backgroundColor: `${colorTheme.disabledButtonColor}80`, height: 1.6, borderRadius: 5, }} />


              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "90%",
              }}>
                <View style={{
                  rowGap: 10,
                }}>

                  <View style={{
                    rowGap: 7,
                  }}>

                    <Text style={{
                      fontFamily: "IBMPlexSans_700Bold",
                      color: colorTheme.textColor,
                      fontSize: 17,
                    }}>
                      Selected Action:
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", columnGap: 7 }}>
                      <Text style={{
                        fontFamily: "IBMPlexSans_500Medium",
                        color: colorTheme.textColor,
                        fontSize: 16,
                      }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {typeof aux.action === "string" ? aux.action : aux.action.name}
                      </Text>
                      {
                        typeof aux.action === "object" ? (
                          <IonIcons name="sparkles-outline" size={16} color={colorTheme.textColor} style={{ marginTop: 2 }} />
                        ) : <></>
                      }
                    </View>
                  </View>

                  <View style={{
                    rowGap: 7,
                  }}>

                    <Text style={{
                      fontFamily: "IBMPlexSans_700Bold",
                      color: colorTheme.textColor,
                      fontSize: 17,
                    }}>
                      Action Type:
                    </Text>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{
                        fontFamily: "IBMPlexSans_500Medium",
                        color: colorTheme.textColor,
                        fontSize: 16,
                      }}>
                        {typeof aux.action === "string" ? "Built-in" : "Custom Macro"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{
                  rowGap: 10,
                }}>

                  <View style={{
                    rowGap: 7,
                  }}>

                    <Text style={{
                      fontFamily: "IBMPlexSans_700Bold",
                      color: colorTheme.textColor,
                      fontSize: 17,
                    }}>
                      Button Type:
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", columnGap: 7 }}>
                      <Text style={{
                        fontFamily: "IBMPlexSans_500Medium",
                        color: colorTheme.textColor,
                        fontSize: 16,
                      }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {
                          aux.type === AUX_SWITCH_TYPE.LATCHING ? "Latching" : "Momentary"
                        }
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    rowGap: 7,
                  }}>

                    <Text style={{
                      fontFamily: "IBMPlexSans_700Bold",
                      color: colorTheme.textColor,
                      fontSize: 17,
                    }}>
                      Macro Loop:
                    </Text>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{
                        fontFamily: "IBMPlexSans_500Medium",
                        color: colorTheme.textColor,
                        fontSize: 16,
                      }}>
                        {
                          aux.looping ? "Enabled" : "Disabled"
                        }
                      </Text>
                    </View>
                  </View>
                </View>
              </View>




              {
                ((aux.id === AUX_ID.AUX1 && unsavedAux1) ||
                  (aux.id === AUX_ID.AUX2 && unsavedAux2)) ?
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    columnGap: 7,
                    marginTop: -10,
                    width: "90%",
                  }}>
                    <IonIcons style={{ marginTop: 2 }} name="warning-outline" color={"#FFBF00E0"} size={14} />
                    <Text style={{
                      color: "#FFBF00E0",
                      fontFamily: "IBMPlexSans_300Light",
                      fontSize: 13
                    }}>
                      Warning: Unsaved Changes
                    </Text>
                  </View>
                  : <></>
              }
            </View>
          ))
        }


        <SettingsToolbar
          disabled={!isConnected || !auxiliaryButtonsEnabled}
          reset={resetAuxActions}
          save={updateAuxAction}
          resetText="Reset Auxiliary"
          saveText="Save Settings"
        />

      </SafeAreaView>

      <AuxSettingsModal
        visible={auxModalOpen}
        close={() => setAuxModalOpen(false)}
        setAux={(action, settings) => {
          if (auxToDisplay === AUX_ID.AUX1) {
            setAux1(action);
            setLoop1(settings.looping);
            setType1(settings.switchType);
          } else {
            setAux2(action);
            setLoop2(settings.looping);
            setType2(settings.switchType);
          }

          setAuxModalOpen(false);
        }}
        auxToDisplay={auxToDisplay}
        initialValues={{
          action: auxToDisplay === AUX_ID.AUX1 ? aux1 : aux2,
          buttonType: auxToDisplay === AUX_ID.AUX1 ? type1 : type2,
          looping: auxToDisplay === AUX_ID.AUX1 ? loop1 : loop2,
        }}
      />

      <UnsavedChangesModal
        cancel={() => setUnsavedChangesModalOpen(false)}
        discardChanges={() => {
          setAux1(aux1Action);
          setLoop1(aux1Loop);
          setType1(aux1Type);

          setAux2(aux2Action);
          setLoop2(aux2Loop);
          setType2(aux2Type);

          setUnsavedChangesModalOpen(false);
          navigation.goBack();
        }}
        visible={unsavedChangesModalOpen}
        saveChanges={async () => {
          await updateAuxAction()
          navigation.goBack();
        }}
      />
    </>
  )
}