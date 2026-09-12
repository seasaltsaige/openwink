import { Modal, Pressable, Text, View } from "react-native";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import ToggleSwitch from "toggle-switch-react-native";
import { TooltipHeader } from "./TooltipHeader";
import { useFocusEffect } from "@react-navigation/native";
import { AutoConnectStore, AUX_ID, AuxButtonStore, CustomCommandStore, CustomOEMButtonStore, CustomWaveStore, DeviceMACStore, HeadlightOrientationStore, QuickLinksStore, SleepyEyeStore, ThemeStore } from "../Storage";
import { getDevicePasskey } from "../helper/Functions";
import * as FileSystem from "expo-file-system"
import * as FileSharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { SettingsPresetsStore } from "../Storage/SettingsPresetsStore";


interface IImportExportModal {
  visible: boolean;
  profile: string;
  close: () => void;
}

export type ExportSettingOptions = {
  pairing: boolean;
  customCommands: boolean;
  oemButtonConfig: boolean;
  auxButtonConfig: boolean;
  appTheme: boolean;
  waveDelayConfig: boolean;
  sleepyEyeConfig: boolean;
  autoConnection: boolean;
  quickLinkSettings: boolean;
  orientation: boolean;
}

const options: readonly {
  name: string;
  type: keyof ExportSettingOptions
  tooltipText?: string;
  defaultState: boolean;
}[] = [
    {
      name: "Pairing Information",
      type: "pairing",
      defaultState: false,
      tooltipText: "Pairing information will allow any phone who owns this confiruration to connect to your module. Share with caution."
    },
    {
      name: "Custom Commands",
      type: "customCommands",
      defaultState: true,
    },
    {
      name: "OEM Button Configuration",
      type: "oemButtonConfig",
      defaultState: true,
    },
    {
      name: "Aux Button Configuration",
      type: "auxButtonConfig",
      defaultState: true,
    },
    {
      name: "Wave Settings",
      type: "waveDelayConfig",
      defaultState: true,
    },
    {
      name: "Sleepy Eye Settings",
      type: "sleepyEyeConfig",
      defaultState: true,
    },
    {
      name: "Auto Connect",
      type: "autoConnection",
      defaultState: true,
    },
    {
      name: "Left/Right Orientation",
      type: "orientation",
      defaultState: true,
    },
    {
      name: "App Theme",
      type: "appTheme",
      defaultState: true,
    },
    {
      name: "Quick Links",
      type: "quickLinkSettings",
      defaultState: true,
    }
  ];


export function ExportModal({
  visible,
  profile,
  close
}: IImportExportModal) {

  const { colorTheme, theme } = useColorTheme();
  const [selectedSettings, setSelectedSettings] = useState({} as Partial<ExportSettingOptions>);

  useFocusEffect(useCallback(() => {
    // useFocusEffect()
    setSelectedSettings({});
    console.log
    for (const setting of options) {
      setSelectedSettings((prev) => (
        {
          ...prev,
          [setting.type]: setting.defaultState,
        }
      ))
    }
  }, [visible]));

  const toggleSwitch = useCallback((setting: keyof ExportSettingOptions, isOn: boolean) => {
    setSelectedSettings((prev) => {
      const next = {
        ...prev,
        [setting]: isOn,
      }
      return next;
    });
  }, []);

  const buildExportObject = useCallback(() => {
    const data: Partial<Record<(keyof ExportSettingOptions) | "profileName", any>> = {
      profileName: profile,
    };

    SettingsPresetsStore.getPreset(profile);

    if (selectedSettings.appTheme) {
      const appTheme = ThemeStore.getStoredTheme();
      data.appTheme = appTheme;
    }

    if (selectedSettings.autoConnection) {
      const autoConn = AutoConnectStore.get();
      data.autoConnection = autoConn;
    }

    if (selectedSettings.auxButtonConfig) {
      const auxSettings = {
        enabled: AuxButtonStore.getStatus(),
        auxOne: {
          switchType: AuxButtonStore.getAuxButtonType(AUX_ID.AUX1),
          pressAction: AuxButtonStore.getAuxButtonAction(AUX_ID.AUX1),
          actionLoop: AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX1),
        },
        auxTwo: {
          switchType: AuxButtonStore.getAuxButtonType(AUX_ID.AUX2),
          pressAction: AuxButtonStore.getAuxButtonAction(AUX_ID.AUX2),
          actionLoop: AuxButtonStore.getAuxButtonLoop(AUX_ID.AUX2),
        }
      }
      data.auxButtonConfig = auxSettings;
    }

    if (selectedSettings.customCommands) {
      const macros = CustomCommandStore.getAll();
      data.customCommands = macros;
    }

    if (selectedSettings.oemButtonConfig) {
      const btnSettings = {
        enabled: CustomOEMButtonStore.isEnabled(),
        headlightBypassEnabled: CustomOEMButtonStore.isBypassEnabled(),
        pressInterval: CustomOEMButtonStore.getDelay(),
        pressActions: CustomOEMButtonStore.getAll(),
      }
      data.oemButtonConfig = btnSettings;
    }

    if (selectedSettings.orientation) {
      const orientation = HeadlightOrientationStore.getStatus();
      data.orientation = orientation;
    }

    if (selectedSettings.pairing) {
      const pairingInfo = {
        mac: DeviceMACStore.getStoredMAC(),
        pairingKey: getDevicePasskey(),
        firmwareVersion: "",
      }
      data.pairing = pairingInfo;
    }

    if (selectedSettings.sleepyEyeConfig) {
      const sleepy = {
        left: SleepyEyeStore.get("left"),
        right: SleepyEyeStore.get("right"),
      }
      data.sleepyEyeConfig = sleepy;
    }

    if (selectedSettings.waveDelayConfig) {
      const waveDelay = CustomWaveStore.getMultiplier();
      data.waveDelayConfig = waveDelay;
    }

    if (selectedSettings.quickLinkSettings)
      data.quickLinkSettings = QuickLinksStore.getLinks();

    return data;
  }, [selectedSettings]);


  const exportSettings = async () => {
    const settingsData = buildExportObject();
    const stringified = JSON.stringify(settingsData, null, 2);

    const fileShareAvailable = await FileSharing.isAvailableAsync();
    if (fileShareAvailable) {
      const filePath = `${FileSystem.cacheDirectory}${settingsData.profileName.trim().replace(/[?%*|:"<>\\/]/g, '').replace(/\s+/g, '_')}.json`;

      await FileSystem.writeAsStringAsync(filePath, stringified, {
        encoding: FileSystem.EncodingType.UTF8
      });

      await FileSharing.shareAsync(filePath, {
        mimeType: "application/json",
      });

      close();
    } else {
      Toast.show({
        type: "error",
        text1: "Unable to Export",
        text2: "Something went wrong while trying to export your profile information.",
      });
    }

  }

  const canExport = Object.keys(selectedSettings).map((key) => selectedSettings[key as keyof ExportSettingOptions]).includes(true);

  return (
    <Modal
      onRequestClose={close}
      transparent
      animationType="fade"
      visible={visible}
    >
      <ModalBlurBackground>
        <View
          style={{
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingBottom: 15,
            paddingHorizontal: 20,
            rowGap: 15
          }}
        >
          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center",

            }}
          >
            Export Configuration
          </Text>


          <Text
            style={{
              width: "85%",
              color: colorTheme.headerTextColor,
              fontSize: 16,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",

            }}
          >
            Exporting profile information for{"\n"}'{profile}'
          </Text>


          <View
            style={{
              width: "90%",
              rowGap: 8,
              marginBottom: 10,
            }}
          >
            {
              options.map((option) => (
                <Pressable
                  key={option.type}
                  hitSlop={10}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >

                  {
                    option.tooltipText !== undefined ? (
                      <TooltipHeader
                        tooltipContent={
                          <Text style={theme.tooltipContainerText}>
                            {option.tooltipText}
                          </Text>}
                        tooltipTitle={option.name}
                        titleStyle={{
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_400Regular",
                          fontSize: 16,
                          textAlign: "left",
                        }}
                        iconStyle={{ marginTop: 2 }}
                      />
                    ) : (
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        columnGap: 10
                      }}>
                        <Text style={{
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_400Regular",
                          fontSize: 16,
                          textAlign: "left",
                        }}>
                          {option.name}
                        </Text>
                      </View>
                    )
                  }





                  {/* <IonIcons name="square-outline" size={22} color={colorTheme.textColor} /> */}

                  <ToggleSwitch
                    isOn={selectedSettings[option.type] ? true : false}
                    onToggle={(isOn) => toggleSwitch(option.type, isOn)}
                    onColor={colorTheme.buttonColor}
                    offColor={colorTheme.disabledButtonColor}
                    size="medium"
                    hitSlop={10}
                    circleColor={colorTheme.buttonTextColor}
                  />
                </Pressable>
              ))
            }
          </View>



          <View style={{
            // width: "100%",
            // flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            rowGap: 10,
            // justifyContent: "space-evenly"
          }}>


            <Pressable
              style={({ pressed }) => ({
                backgroundColor: !canExport ? colorTheme.disabledButtonColor : pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "40%",
                paddingHorizontal: 20,
                paddingVertical: 6,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
              disabled={!canExport}
              onPress={() => exportSettings()}
              hitSlop={10}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  }}
                >
                  Export
                </Text>
              }
            </Pressable>

            <Pressable
              onPress={close}
              hitSlop={10}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    textDecorationLine: "underline"
                  }}
                >
                  Cancel
                </Text>
              }
            </Pressable>

          </View>

        </View>
      </ModalBlurBackground>
    </Modal>
  )
}