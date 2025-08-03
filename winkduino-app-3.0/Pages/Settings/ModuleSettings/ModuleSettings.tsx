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

  const { colorTheme, theme } = useColorTheme();
  const navigate = useNavigation();

  const { device, manager, isScanning, isConnecting, scanForModule, autoConnectEnabled, setAutoConnect } = useBLE();

  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const [accordionOpen, setAccordionOpen] = useState(false);

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState<"sleep" | "delete" | "forget">("sleep");
  const [actionFunction, setActionFunction] = useState<() => Promise<void>>();
  const [toggleOn, setToggleOn] = useState(autoConnectEnabled);

  const togglePress = async (val: boolean) => {
    setToggleOn(val);
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
    await CustomCommandStore.deleteAll();
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
      <View style={theme.moduleSettingsContainer}>

        <View style={theme.headerContainer}>

          <Pressable
            style={theme.backButtonContainer}
            onPress={() => navigate.goBack()}
          >
            {({ pressed }) => (
              <>
                <IonIcons style={theme.backButtonContainerIcon} name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />
                <Text style={pressed ? theme.backButtonContainerTextPressed : theme.backButtonContainerText}>{back}</Text>

                {
                  device ? (
                    <IonIcons style={theme.backButtonContainerIcon} name="wifi-outline" color="#367024" size={23} />
                  ) : (
                    isConnecting || isScanning ?
                      <ActivityIndicator style={theme.backButtonContainerIcon} color={colorTheme.buttonColor} />
                      : (
                        <IonIcons style={theme.backButtonContainerIcon} name="cloud-offline-outline" color="#b3b3b3" size={23} />
                      )
                  )
                }
              </>
            )}
          </Pressable>

          <Text style={theme.settingsHeaderText}>
            Module
          </Text>

        </View>

        <View style={[theme.homeScreenButtonsContainer, { rowGap: 15 }]}>

          {/* TODO: MOVE TO main settings page? dont have an app settings... */}
          <View style={theme.mainLongButtonPressableContainer}>
            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name="infinite-outline" size={25} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Auto Connect
              </Text>
            </View>

            <View style={theme.mainLongButtonPressableIcon}>
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
                style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
                //@ts-ignore
                onPress={() => navigate.navigate(val.navigationName, { back: route.name, backHumanReadable: "Module Settings" })}
                key={i}
              >

                <View style={theme.mainLongButtonPressableView}>
                  <IonIcons name={val.pageSymbol as any} size={25} color={colorTheme.headerTextColor} />
                  <Text style={theme.mainLongButtonPressableText}>
                    {val.pageName}
                  </Text>
                </View>
                <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>
            ))
          }


          {/* PUT MODULE TO SLEEP */}
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => { setConfirmationType("sleep"); setActionFunction(putModuleToSleep); setConfirmationOpen(true); }}
            key={110}
          >

            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name={"moon-outline"} size={25} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Put Module to Sleep
              </Text>
            </View>
            <IonIcons style={theme.mainLongButtonPressableIcon} name="ellipsis-horizontal" size={20} color={colorTheme.headerTextColor} />
          </Pressable>
        </View>

        {/* ADVANCED (DELETE DATA, FORGET MODULE) */}
        <View style={[theme.settingsDropdownContainer, { paddingBottom: accordionOpen ? 10 : 0 }]}>
          {/* OPEN/CLOSE ACCORDIAN */}
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => setAccordionOpen(!accordionOpen)}
            key={6}
          >

            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name="alert-outline" size={25} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Danger Zone
              </Text>
            </View>

            <IonIcons style={theme.mainLongButtonPressableIcon} name={accordionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color={colorTheme.headerTextColor} />
          </Pressable>


          {
            accordionOpen ?
              <>
                {/* FORGET MODULE */}
                <Pressable
                  style={({ pressed }) => [pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer, { width: "95%" }]}
                  //@ts-ignore
                  onPress={() => { console.log(forgetModulePairing); setConfirmationType("forget"); setActionFunction(() => forgetModulePairing()); setConfirmationOpen(true); }}
                  key={7}
                >

                  <View style={theme.mainLongButtonPressableView}>

                    <IonIcons name="reload" size={25} color={colorTheme.headerTextColor} />
                    <Text style={theme.mainLongButtonPressableText}>
                      Forget Module
                    </Text>
                  </View>
                  <IonIcons style={theme.mainLongButtonPressableIcon} name="ellipsis-horizontal" size={20} color={colorTheme.headerTextColor} />
                </Pressable>



                {/* DELETE SETTINGS */}
                <Pressable
                  style={({ pressed }) => [pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer, { width: "95%" }]}
                  //@ts-ignore
                  onPress={() => { setConfirmationType("delete"); setActionFunction(deleteStoredModuleData); setConfirmationOpen(true); }}
                  key={8}
                >

                  <View style={theme.mainLongButtonPressableView}>
                    <IonIcons name="trash-outline" size={25} color={colorTheme.headerTextColor} />
                    <Text style={theme.mainLongButtonPressableText}>
                      Delete Module Settings
                    </Text>
                  </View>
                  <IonIcons style={theme.mainLongButtonPressableIcon} name="ellipsis-horizontal" size={20} color={colorTheme.headerTextColor} />
                </Pressable>
              </> :
              <></>
          }

        </View>


      </View>

      <ConfirmationModal
        visible={confirmationOpen}
        close={() => setConfirmationOpen(false)}
        type={confirmationType}
        confirmationFunction={actionFunction!}
      />

    </>
  )
}

// Confirmation Modal for module sleep, module forgetting, and data deletion
function ConfirmationModal(props: { visible: boolean; close: () => void; type: "sleep" | "delete" | "forget"; confirmationFunction: () => Promise<void> }) {
  const { colorTheme, theme } = useColorTheme();
  const { device } = useBLE();

  return (
    <Modal
      visible={props.visible}
      onRequestClose={() => props.close()}
      animationType="fade"
      hardwareAccelerated
      transparent
    >

      <View style={theme.modalBackground}>
        <View style={theme.modalSettingsContentContainer}>
          <Text style={theme.modalSettingsConfirmationHeader}>
            {
              props.type === "sleep" ? "Are you sure you want to put your module to sleep?"
                : props.type === "delete" ? "Are you sure you want to delete all saved data?"
                  : "Are you sure you want to forget current pairing?"
            }
          </Text>

          <Text style={theme.modalSettingsConfirmationText}>
            {
              props.type === "sleep" ? "To wake the module, press the headlight retractor button."
                : props.type === "delete" ? "This action is irreversible. All saved settings will be erased."
                  : "Connection information will be forgotten, and pairing must take place again."
            }
          </Text>

          <View style={theme.modalSettingsConfirmationButtonContainer}>
            <Pressable
              style={({ pressed }) => ((props.type === "sleep" || props.type === "delete") && !device) ? theme.modalSettingsConfirmationButtonDisabled : pressed ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton}
              disabled={(props.type === "sleep" || props.type === "delete") && !device}
              onPress={() => props.confirmationFunction()}
            >
              <IonIcons name={props.type === "sleep" ? "moon-outline" : props.type === "forget" ? "unlink-outline" : "trash-outline"} color={colorTheme.headerTextColor} size={20} />
              <Text style={theme.modalSettingsConfirmationButtonText}>
                {props.type === "sleep" ? "Sleep" : props.type === "forget" ? "Forget" : "Delete"}
              </Text>
            </Pressable>


            <Pressable
              style={({ pressed }) => pressed ? theme.modalSettingsConfirmationButtonPressed : theme.modalSettingsConfirmationButton}
              onPress={() => props.close()}
            >
              <Text style={theme.modalSettingsConfirmationButtonText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}