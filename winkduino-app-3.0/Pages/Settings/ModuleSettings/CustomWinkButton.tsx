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

type CustomButtonAction = {
  behavior: number;
  behaviorHumanReadable: ButtonBehaviors;
};

export function CustomWinkButton() {

  const { colorTheme } = useColorTheme();
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

  const { device, isScanning, isConnecting } = useBLE();

  const saveInterval = async () => {
    await updateButtonDelay(intervalValue);
  }

  const fetchActionsFromStorage = async () => {
    const storedActions = await CustomOEMButtonStore.getAll();

  }

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
      <View
        style={{
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 15,
        }}
      >

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}>

          <Pressable style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 10,
            height: "100%"
          }}
            onPress={() => navigation.goBack()}
          >
            {
              ({ pressed }) => (
                <>
                  <IonIcons name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                  <Text style={{
                    color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    fontWeight: "500",
                    fontSize: 20
                  }}>{backHumanReadable}</Text>


                  {
                    device ? (
                      <IonIcons name="wifi-outline" color="#367024" size={21} />
                    ) : (
                      isConnecting || isScanning ?
                        <ActivityIndicator color={colorTheme.buttonColor} />
                        : (
                          <IonIcons name="cloud-offline-outline" color="#b3b3b3" size={23} />
                        )
                    )
                  }
                </>
              )
            }
          </Pressable>


          <Text style={{
            fontSize: 25,
            fontWeight: "600",
            color: colorTheme.headerTextColor,
            width: "auto",
            marginRight: 10,
          }}
          >Custom Button</Text>

        </View>

        <View
          style={{
            backgroundColor: colorTheme.backgroundSecondaryColor,
            width: "100%",
            padding: 5,
            paddingVertical: 13,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 8,
            paddingHorizontal: 20,
          }}
        >

          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontWeight: "bold",
              fontSize: 17,
            }}
          >{oemCustomButtonEnabled ? "Disable" : "Enable"} Custom Button</Text>
          <ToggleSwitch
            onColor={!device ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
            offColor={colorTheme.disabledButtonColor}
            isOn={oemCustomButtonEnabled}
            size="medium"
            hitSlop={10}
            disabled={!device}
            circleColor={colorTheme.buttonTextColor}
            onToggle={async (isOn) => await setOEMButtonStatus(isOn ? "enable" : "disable")}
          />
        </View>

        <View
          style={{
            backgroundColor: colorTheme.backgroundPrimaryColor,
            // height: "100%",
            width: "100%",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 15,
            // borderColor: "pink",
            // borderWidth: 1,
          }}
        >



          {/* Press Interval */}
          <Tooltip
            isVisible={intervalTooltipVisible}
            closeOnBackgroundInteraction
            closeOnContentInteraction
            placement="bottom"
            onClose={() => setIntervalTooltipVisible(false)}
            contentStyle={{
              backgroundColor: colorTheme.backgroundSecondaryColor,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "auto",
              width: "auto",
              borderRadius: 7
            }}
            content={
              <Text style={{
                color: colorTheme.textColor,
                textAlign: "center",
                fontWeight: "500",
                padding: 5,
              }}>
                Maximum time allowed between retractor button presses
                before a sequence takes effect. Between 250ms and 500ms
                is recommended.
              </Text>
            }
          >

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                columnGap: 10,
              }}
            >
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "600",
                  fontSize: 22,
                }}
              >
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

          {/* Button Interval */}
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              rowGap: 12,
              width: "90%",
            }}
          >
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "500",
                fontSize: 19,
              }}
            >
              Current Maximum: {buttonDelay}ms
            </Text>

            <View style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 20,
            }}>
              <TextInput
                // defaultValue={intervalValue.toString()}
                keyboardType="numeric"
                placeholder="Interval in ms"
                placeholderTextColor="grey"
                editable={device !== null}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (isNaN(num)) return;
                  else setIntervalValue(num);
                }}
                style={{
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                  // padding: 15,
                  height: 40,
                  borderRadius: 3,
                  width: "33%",
                  color: colorTheme.textColor,
                  textAlign: "center",
                  // margin: 15,
                }}
              />

              <Pressable
                onPress={() => saveInterval()}
                style={({ pressed }) => ({
                  backgroundColor: !device ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  height: 40,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 80,
                  borderRadius: 7,
                })}
                disabled={!device}
              >
                <Text
                  style={{
                    color: colorTheme.buttonTextColor,
                    fontSize: 18,
                    fontWeight: "500",
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>

          </View>

          {/* Button Actions Tooltip */}
          <Tooltip
            isVisible={actionsTooltipVisible}
            closeOnBackgroundInteraction
            closeOnContentInteraction
            placement="bottom"
            onClose={() => setActionsTooltipVisible(false)}
            contentStyle={{
              backgroundColor: colorTheme.backgroundSecondaryColor,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "auto",
              width: "auto",
              borderRadius: 7,
              // marginTop: 10
            }}
            content={
              <Text style={{
                color: colorTheme.textColor,
                textAlign: "center",
                fontWeight: "500",
                padding: 5,
              }}>
                List of actions certain sequences of button presses will activate.
                The default single button press is unable to be adjusted due to saftey reasons.
              </Text>
            }
          >

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                columnGap: 10,
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "600",
                  fontSize: 22,
                }}
              >
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
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-evenly",
              // marginTop: 10,
              // borderWidth: 1,
              // borderColor: "pink",
            }}
          >

            <Pressable
              style={({ pressed }) => (
                {
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "40%",
                  padding: 5,
                  paddingVertical: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  paddingHorizontal: 15,
                  paddingRight: 10
                }
              )}
            >
              <Text
                style={{
                  color: colorTheme.buttonTextColor,
                  fontSize: 17,
                  fontWeight: 500,
                }}
              >
                Single Press
              </Text>
              <IonIcons size={22} name="ellipsis-horizontal-outline" color={colorTheme.buttonTextColor} />
            </Pressable>

            <Pressable
              style={({ pressed }) => (
                {
                  backgroundColor: !device ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "40%",
                  padding: 5,
                  paddingVertical: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  paddingHorizontal: 15,
                  paddingRight: 10
                }
              )}
              disabled={!device}
            >
              <Text
                style={{
                  color: colorTheme.buttonTextColor,
                  fontSize: 17,
                  fontWeight: 500,
                }}
              >
                Create New
              </Text>
              <IonIcons size={22} name="create-outline" color={colorTheme.buttonTextColor} />
            </Pressable>

          </View>

          <ScrollView>



            {/* TODO: Add list view of custom actions (1-10), along with button to add new action, (each action has edit/remove option) */}
          </ScrollView>


          {/* <DisabledConnection
          name="Custom Button"
        /> */}
        </View>

      </View>


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
  const { colorTheme } = useColorTheme();

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

      <View
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >

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