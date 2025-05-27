import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../../../hooks/useBLE";
import { AutoConnectStore, CustomCommandStore, CustomOEMButtonStore, DeviceMACStore, FirmwareStore, SleepyEyeStore } from "../../../Storage";
import ToggleSwitch from "toggle-switch-react-native";





const moduleSettingsData: Array<{
  pageName: string;
  pageSymbol: string;
  navigationName: string;
}> = [
    // {
    //   pageName: "Automatic Connection",
    //   navigationName: "AutoConnectSettings",
    //   pageSymbol: "infinite-outline",
    // },
    {
      pageName: "Wave Delay Settings",
      navigationName: "WaveDelaySettings",
      pageSymbol: "settings-outline",
    },
    {
      pageName: "Sleepy Eye Settings",
      navigationName: "SleepyEyeSettings",
      pageSymbol: "settings-outline"
    },
    {
      pageName: "Set Up Custom Wink Buton",
      navigationName: "CustomWinkButton",
      pageSymbol: "options-outline",
    },
  ]




export function ModuleSettings() {

  const { colorTheme } = useColorTheme();
  const navigate = useNavigation();

  const { device, manager, isScanning, isConnecting, scanForModule, autoConnectEnabled, setAutoConnect } = useBLE();

  // const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const [accordionOpen, setAccordionOpen] = useState(false);

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState<"sleep" | "delete" | "forget">("sleep");
  const [actionFunction, setActionFunction] = useState<() => Promise<void>>(async () => { });
  const [toggleOn, setToggleOn] = useState(autoConnectEnabled);

  const togglePress = async (val: boolean) => {


    setToggleOn(val);

    console.log(val);
    if (val) {
      await AutoConnectStore.enable();
      setAutoConnect(true);
      if (!device && !isConnecting && !isScanning) scanForModule();
    } else {
      await AutoConnectStore.disable();
      setAutoConnect(false);
      if (isScanning) await manager.stopDeviceScan();
    }
  }

  const deleteStoredModuleData = async () => {
    await AutoConnectStore.disable();
    await CustomCommandStore.deleteAllCommands();
    await CustomOEMButtonStore.disable();
    await CustomOEMButtonStore.removeAll();
    await DeviceMACStore.forgetMAC();
    await FirmwareStore.forgetFirmwareVersion();
    await SleepyEyeStore.reset("both");
  }

  const putModuleToSleep = async () => {

  }

  const forgetModulePairing = async () => {
    if (!device) return;
    await device.cancelConnection();
    await DeviceMACStore.forgetMAC();
  }


  return (
    <>
      <View
        style={{
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
          padding: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: 40,
        }}
      >

        <View style={{
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
            onPress={() => navigate.goBack()}
          >
            {
              ({ pressed }) => (

                <>
                  <IonIcons name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                  <Text style={{
                    color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    fontWeight: "500",
                    fontSize: 22
                  }}>{back}</Text>

                  {
                    device ? (
                      <IonIcons name="wifi-outline" color="#367024" size={23} />
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
            fontSize: 30,
            fontWeight: "600",
            color: colorTheme.headerTextColor,
            width: "auto",
            marginRight: 10,
          }}
          >Module Settings</Text>

        </View>

        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            // width: "100%",
            rowGap: 15,
          }}
        >

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
            }}
          >

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                //@ts-ignore
                name="infinite-outline"
                size={25}
                color={colorTheme.headerTextColor}
              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 17,
                }}
              >Auto Connect</Text>

            </View>
            <View style={{ marginRight: 10, }}>
              <ToggleSwitch

                onColor={colorTheme.buttonColor}
                offColor={colorTheme.disabledButtonColor}
                isOn={toggleOn}
                size="medium"
                hitSlop={10}
                circleColor={colorTheme.buttonTextColor}
                onToggle={(isOn) => { togglePress(!!isOn) }}
              />
            </View>
          </View>


          {
            moduleSettingsData.map((val, i) => (
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 5,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                })}
                //@ts-ignore
                onPress={() => navigate.navigate(val.navigationName, { back: route.name, backHumanReadable: "Module Settings" })}
                key={i}>

                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 10,
                    marginLeft: 10,
                  }}
                >

                  <IonIcons
                    //@ts-ignore
                    name={val.pageSymbol}
                    size={25}
                    color={colorTheme.headerTextColor}
                  />
                  <Text
                    style={{
                      color: colorTheme.headerTextColor,
                      fontWeight: "bold",
                      fontSize: 17,
                    }}
                  >{val.pageName}</Text>

                </View>
                <IonIcons style={{ marginRight: 10 }} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>
            ))
          }


          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 13,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => { setConfirmationType("sleep"); setActionFunction(putModuleToSleep); setConfirmationOpen(true); }}
            key={110}>
            {
              ({ pressed }) => (
                <>

                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      columnGap: 10,
                      marginLeft: 10,
                    }}
                  >


                    <IonIcons
                      name={"moon-outline"}
                      size={25}
                      color={colorTheme.headerTextColor}
                    />
                    <Text
                      style={{
                        color: colorTheme.headerTextColor,
                        fontWeight: "bold",
                        fontSize: 17,
                      }}
                    >Put Module to Sleep</Text>

                  </View>
                  <IonIcons style={{ marginRight: 10 }} name="ellipsis-horizontal-outline" size={20} color={colorTheme.headerTextColor} />
                </>
              )
            }
          </Pressable>

        </View>

        {/* ADVANCED (DELETE DATA, FORGET MODULE) */}
        <View
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            rowGap: 10,
            backgroundColor: accordionOpen ? colorTheme.dropdownColor : colorTheme.backgroundPrimaryColor,
            paddingBottom: accordionOpen ? 10 : 0,
            borderRadius: 8,
          }}
        >

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 13,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => setAccordionOpen(!accordionOpen)}
            key={6}>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                name="alert-outline"
                size={25}
                color={colorTheme.headerTextColor}

              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 17,
                }}
              >Danger Zone</Text>
            </View>
            <IonIcons style={{ marginRight: 10 }} name={accordionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color={colorTheme.headerTextColor} />
          </Pressable>


          {
            accordionOpen ? <>


              {/* FORGET MODULE */}
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "95%",
                  padding: 5,
                  paddingVertical: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                })}
                //@ts-ignore
                onPress={() => { setConfirmationType("forget"); setActionFunction(forgetModulePairing); setConfirmationOpen(true); }}
                key={7}>

                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 10,
                    marginLeft: 10,
                  }}
                >

                  <IonIcons
                    name="reload"
                    size={25}
                    color={colorTheme.headerTextColor}
                  />
                  <Text
                    style={{
                      color: colorTheme.headerTextColor,
                      fontWeight: "bold",
                      fontSize: 17,
                    }}
                  >Forget Module</Text>
                </View>
                <IonIcons style={{ marginRight: 10 }} name="ellipsis-horizontal-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>



              {/* DELETE SETTINGS */}
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "95%",
                  padding: 5,
                  paddingVertical: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                })}
                //@ts-ignore
                onPress={() => { setConfirmationType("delete"); setActionFunction(deleteStoredModuleData); setConfirmationOpen(true); }}
                key={8}>

                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 10,
                    marginLeft: 10,
                  }}
                >

                  <IonIcons
                    name="trash-outline"
                    size={25}
                    color={colorTheme.headerTextColor}
                  />
                  <Text
                    style={{
                      color: colorTheme.headerTextColor,
                      fontWeight: "bold",
                      fontSize: 17,
                    }}
                  >Delete Module Settings</Text>
                </View>
                <IonIcons style={{ marginRight: 10 }} name="ellipsis-horizontal-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>
            </> : <></>
          }

        </View>


      </View>

      <ConfirmationModal
        visible={confirmationOpen}
        close={() => setConfirmationOpen(false)}
        type={confirmationType}
        confirmationFunction={actionFunction}
      />

    </>
  )
}



// Confirmation Modal for module sleep, module forgetting, and data deletion
function ConfirmationModal(props: { visible: boolean; close: () => void; type: "sleep" | "delete" | "forget"; confirmationFunction: () => Promise<void> }) {
  const { colorTheme } = useColorTheme();
  const { device } = useBLE();

  return (
    <Modal
      visible={props.visible}
      onRequestClose={() => props.close()}
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
            // height: "45%",
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
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
              color: colorTheme.headerTextColor
            }}
          >
            {
              props.type === "sleep" ? "Are you sure you want to put your module to sleep?"
                : props.type === "delete" ? "Are you sure you want to delete all saved data?"
                  : "Are you sure you want to forget current pairing?"
            }
          </Text>

          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              fontWeight: "400",
              color: colorTheme.textColor,
            }}
          >
            {
              props.type === "sleep" ? "To wake the module, press the headlight retractor button."
                : props.type === "delete" ? "This action is irreversible. All saved settings will be erased."
                  : "Connection information will be forgotten, and pairing must take place again."
            }
          </Text>

          <View
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly"
            }}
          >
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: (props.type === "sleep" && !device) ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                width: "40%",
                padding: 5,
                paddingVertical: 8,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                borderRadius: 8,
              })}
              disabled={props.type === "sleep" && !device}
              onPress={() => props.confirmationFunction()}
            >
              <IonIcons
                name={props.type === "sleep" ? "moon-outline" : props.type === "forget" ? "unlink-outline" : "trash-outline"}
                color={colorTheme.buttonTextColor}
                size={20}
              />
              <Text
                style={{
                  color: colorTheme.buttonTextColor,
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {
                  props.type === "sleep" ? "Sleep" : props.type === "forget" ? "Forget" : "Delete"
                }
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                width: "40%",
                padding: 5,
                paddingVertical: 8,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                borderRadius: 8,
              })}
              onPress={() => props.close()}
            >
              <Text
                style={{
                  color: colorTheme.buttonTextColor,
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                Cancel
              </Text>

            </Pressable>
          </View>
        </View>

      </View>

    </Modal>
  )
}