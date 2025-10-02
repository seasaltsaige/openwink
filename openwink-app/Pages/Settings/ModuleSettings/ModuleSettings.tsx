import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import IonIcons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import ToggleSwitch from "toggle-switch-react-native";

import {
  AutoConnectStore,
  CustomCommandStore,
  CustomOEMButtonStore,
  CustomWaveStore,
  FirmwareStore,
  QuickLinksStore,
  SleepyEyeStore
} from "../../../Storage";
import { ConfirmationModal, LongButton, HeaderWithBackButton } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import { useBleCommand } from "../../../Providers/BleCommandProvider";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";

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

  const { colorTheme, theme, reset } = useColorTheme();
  const navigate = useNavigation();

  const {
    manager,
    isScanning,
    isConnecting,
    scanForModule,
    autoConnectEnabled,
    setAutoConnect,
    unpair,
  } = useBleConnection();

  const { isConnected } = useBleMonitor();

  const {
    enterDeepSleep,
    resetModule
  } = useBleCommand();

  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const [accordionOpen, setAccordionOpen] = useState(false);

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationType, setConfirmationType] = useState<"sleep" | "delete" | "forget">("sleep");
  // const [actionFunction, setActionFunction] = useState<(() => Promise<void>) | null>(null);
  const [toggleOn, setToggleOn] = useState(autoConnectEnabled);

  const deleteStoredModuleData = async () => {

    await resetModule();

    AutoConnectStore.enable();
    CustomCommandStore.deleteAll();
    CustomOEMButtonStore.disable();
    CustomOEMButtonStore.removeAll();
    FirmwareStore.forgetFirmwareVersion();
    SleepyEyeStore.reset("both");
    CustomWaveStore.reset();
    QuickLinksStore.reset();
    await reset();

    Toast.show({
      autoHide: true,
      visibilityTime: 8000,
      type: "success",
      text1: "Reset Successful",
      text2: "OpenWink Module successfully reset to factory defaults. All stored settings have been reset."
    });

  }

  const putModuleToSleep = async () => {
    if (!isConnected) return;
    await enterDeepSleep();

    Toast.show({
      autoHide: true,
      visibilityTime: 8000,
      type: "success",
      text1: "Sleep Successful",
      text2: "OpenWink Module successfully put into deep sleep. To wake the module, press the retractor button."
    });
  }

  const forgetModulePairing = async () => {
    if (!isConnected) return;
    await unpair();

    Toast.show({
      autoHide: true,
      visibilityTime: 8000,
      type: "success",
      text1: "Unpair Successful",
      text2: "OpenWink Module successfully unpaired. To repair, reconnect to module."
    });
  }


  const togglePress = async (val: boolean) => {
    setToggleOn(val);
    if (val) {
      AutoConnectStore.enable();
      setAutoConnect(true);
      if (!isConnected && !isConnecting && !isScanning) scanForModule();
    } else {
      AutoConnectStore.disable();
      setAutoConnect(false);
      if (isScanning) await manager.stopDeviceScan();
    }
  }

  const confirmationBody = confirmationType === "sleep" ?
    "To wake the module, press the headlight retractor button." :
    confirmationType === "delete" ?
      "This action is irreversible. All saved settings will be erased." :
      "Connection information will be forgotten, and pairing must take place again.";
  const confirmationHeader = "Are you sure?";


  return (
    <>
      <SafeAreaView style={theme.moduleSettingsContainer}>
        <HeaderWithBackButton
          backText={back}
          headerText="Module"
          deviceStatus
        />

        <View style={[theme.homeScreenButtonsContainer, { rowGap: 15 }]}>
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
            onPress={() => {
              setConfirmationType("sleep");
              setConfirmationOpen(true);
            }}
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
                onPress={() => {
                  setConfirmationType("forget");
                  setConfirmationOpen(true);
                }}
                key="Forget"
                icons={{ names: ["reload", "ellipsis-horizontal"], size: [25, 20] }}
                text="Forget Module"
              />

              {/* DELETE SETTINGS */}
              <LongButton
                pressableStyle={{ width: "95%" }}
                onPress={() => {
                  setConfirmationType("delete");
                  setConfirmationOpen(true);
                }}
                key="Delete"
                icons={{ names: ["trash-outline", "ellipsis-horizontal"], size: [25, 20] }}
                text="Delete Module Settings"
              />
            </>
          }

        </View>
      </SafeAreaView>


      <ConfirmationModal
        visible={confirmationOpen}
        onRequestClose={() => setConfirmationOpen(false)}
        body={confirmationBody}
        header={confirmationHeader}
        cancelButton="Cancel"
        confirmButton={confirmationType === "sleep" ? "Put to Sleep" : confirmationType === "forget" ? "Forget Module" : "Delete Settings"}
        onConfirm={() => {
          if (confirmationType === "sleep") putModuleToSleep();
          else if (confirmationType === "forget") forgetModulePairing();
          else deleteStoredModuleData();
        }}
        animationType="fade"
        disableConfirmation={!isConnected}
      />

    </>
  )
}