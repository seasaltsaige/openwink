import { Modal, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { ApplyType, SettingsPresetsStore } from "../../../Storage/SettingsPresetsStore";
import { ModalBlurBackground } from "../../../Components";
import ToggleSwitch from "toggle-switch-react-native";
import { useState } from "react";
import Tooltip from "react-native-walkthrough-tooltip";
import IonIcons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { useBleConnection } from "../../../Providers/BleConnectionProvider";
import { useBleMonitor } from "../../../Providers/BleMonitorProvider";

interface IApplyConfirmationModal {
  visible: boolean;
  close: () => void;
  presetName: string;
}

export const ApplyConfirmationModal = (props: IApplyConfirmationModal) => {

  const { colorTheme, theme, refreshTheme } = useColorTheme();

  const { updateProfile, disconnect, isConnected } = useBleConnection();
  const { refreshConnection } = useBleConnection();
  const { refreshMonitorStatus } = useBleMonitor();

  const [applyAsNew, setApplyAsNew] = useState(false);
  const [applyTooltipOpen, setApplyTooltipOpen] = useState(false);

  const applyPreset = async (type: ApplyType) => {
    SettingsPresetsStore.applyPreset(props.presetName, type);
    setApplyAsNew(false);

    refreshTheme(); // Refresh theme in case it was changed by the preset
    props.close();

    try {
      // If applying as new device, disconnect from current device to allow new device with the profile's pairing info
      if (isConnected) {
        if (type === ApplyType.AS_NEW_DEVICE)
          await disconnect(false);

        await updateProfile();
      }

      // Refresh related settings so they are displayed correctly in different pages.
      await refreshConnection();
      await refreshMonitorStatus();

      Toast.show({
        type: "success",
        text1: "Profile Applied",
        text2: `The profile '${props.presetName}' has been applied successfully.`,
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error Applying Profile",
        text2: `An error occurred while applying the profile '${props.presetName}'. Please try again.`,
      });
    }
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={props.visible}
      onRequestClose={props.close}
    >
      <ModalBlurBackground>
        <View
          style={{
            width: "85%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
            rowGap: 10
          }}
        >
          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center"
            }}
          >
            Apply Profile '{props.presetName}'
          </Text>

          <View style={[theme.mainLongButtonPressableContainer, { backgroundColor: undefined, padding: 0 }]}>
            <View style={theme.mainLongButtonPressableView}>
              <Text style={theme.mainLongButtonPressableText}>
                Apply Pairing Info
              </Text>
              <Tooltip
                isVisible={applyTooltipOpen}
                onClose={() => setApplyTooltipOpen(false)}
                content={
                  <Text style={theme.tooltipContainerText}>
                    If enabled, applying the settings profile will apply the Bluetooth pairing info stored in the profile. This is useful when switching between profiles used between different devices. If disabled, applying the settings profile will keep the current Bluetooth pairing info.
                  </Text>
                }
                closeOnBackgroundInteraction
                closeOnContentInteraction
                placement="bottom"
                contentStyle={theme.tooltipContainer}
              >
                <Pressable
                  hitSlop={20}
                  onPress={() => setApplyTooltipOpen(true)}
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
                onColor={colorTheme.buttonColor}
                offColor={colorTheme.disabledButtonColor}
                isOn={applyAsNew}
                size="medium"
                hitSlop={10}
                circleColor={colorTheme.buttonTextColor}
                onToggle={(isOn) => { setApplyAsNew(isOn) }}
              />
            </View>
          </View>


          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 8,
            marginBottom: 10,
          }}>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "60%",
                paddingVertical: 6,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
              onPress={() => applyPreset(applyAsNew ? ApplyType.AS_NEW_DEVICE : ApplyType.AS_OLD_DEVICE)}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.headerTextColor,
                  }}
                >
                  Apply Profile
                </Text>
              }
            </Pressable>

            <Pressable
              onPress={() => { setApplyAsNew(false); props.close(); }}
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