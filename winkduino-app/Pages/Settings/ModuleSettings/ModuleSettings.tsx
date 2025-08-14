import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../../../hooks/useBLE";
import { AutoConnectStore, CustomCommandStore, CustomOEMButtonStore, DeviceMACStore, FirmwareStore, SleepyEyeStore } from "../../../Storage";
import ToggleSwitch from "toggle-switch-react-native";
import { LongButton } from "../../../Components/LongButton";
import { HeaderWithBackButton } from "../../../Components/HeaderWithBackButton";

const moduleSettingsData: Array<{
  pageName: string;
  pageSymbol: string;
  navigationName: string;
}> = [
    {
      pageName: "Wave Delay Settings",
      navigationName: "WaveDelaySettings",
      pageSymbol: "radio-outline",
    },
    {
      pageName: "Sleepy Eye Settings",
      navigationName: "SleepyEyeSettings",
      pageSymbol: "eye-outline"
    },
    {
      pageName: "Set Up Custom Wink Buton",
      navigationName: "CustomWinkButton",
      pageSymbol: "speedometer-outline",
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
        <HeaderWithBackButton
          backText={back}
          headerText="Module"
        />

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
            moduleSettingsData.map((val) => (
              <LongButton
                // @ts-ignore
                onPress={() => navigate.navigate(val.navigationName, { back: route.name, backHumanReadable: "Module Settings" })}
                key={val.pageName}
                icons={{ names: [val.pageSymbol as any, "chevron-forward-outline"], size: [25, 20] }}
                text={val.pageName}
              />
            ))
          }


          {/* PUT MODULE TO SLEEP */}
          <LongButton
            // @ts-ignore
            onPress={() => { setConfirmationType("sleep"); setActionFunction(putModuleToSleep); setConfirmationOpen(true); }}
            key={"Sleep"}
            icons={{ names: ["moon-outline", "ellipsis-horizontal"], size: [25, 20] }}
            text="Put Module to Sleep"
          />
        </View>

        {/* ADVANCED (DELETE DATA, FORGET MODULE) */}
        <View style={[theme.settingsDropdownContainer, { paddingBottom: accordionOpen ? 10 : 0 }]}>
          {/* OPEN/CLOSE ACCORDIAN */}
          <LongButton
            onPress={() => setAccordionOpen(!accordionOpen)}
            key={"Accordion"}
            icons={{ names: ["alert-outline", accordionOpen ? "chevron-up-outline" : "chevron-down-outline"], size: [25, 20] }}
            text="Danger Zone"
          />

          {
            accordionOpen &&
            <>
              {/* FORGET MODULE */}
              <LongButton
                pressableStyle={{ width: "95%" }}
                onPress={() => { setConfirmationType("forget"); setActionFunction(forgetModulePairing); setConfirmationOpen(true); }}
                key="Forget"
                icons={{ names: ["reload", "ellipsis-horizontal"], size: [25, 20] }}
                text="Forget Module"
              />

              {/* DELETE SETTINGS */}
              <LongButton
                pressableStyle={{ width: "95%" }}
                onPress={() => { setConfirmationType("delete"); setActionFunction(deleteStoredModuleData); setConfirmationOpen(true); }}
                key="Delete"
                icons={{ names: ["trash-outline", "ellipsis-horizontal"], size: [25, 20] }}
                text="Delete Module Settings"
              />
            </>
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