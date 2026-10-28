import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";

import { useColorTheme } from "../hooks/useColorTheme";
import { useBleMonitor } from "../Providers/BleMonitorProvider";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { ERROR_TYPE, UPDATE_STATUS } from "../hooks/useUpdateManager";
import { AppUpdateInfo } from "../helper/Handlers/App";
import { FirmwareStore } from "../Storage";
import { compareVersions, getRunningAppVersion } from "../helper/Functions";

enum ModalState {
  DESCRIPTION,
  UPDATE,
  ERROR_FIRMWARE_VERSION,
}

interface IAppUpdateModal {
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  updateStatus: UPDATE_STATUS;
  error: ERROR_TYPE;
  startUpdate: () => Promise<boolean>;
  onRequestModuleUpdate?: () => void;
  close: (showToast: boolean) => void;
}

export function AppUpdateModal({
  visible,
  updateInfo,
  updateStatus,
  error,
  startUpdate,
  onRequestModuleUpdate,
  close,
}: IAppUpdateModal) {
  const { colorTheme } = useColorTheme();
  const { firmwareVersion } = useBleMonitor();

  const [modalState, setModalState] = useState(ModalState.DESCRIPTION);

  const currentAppVersion = getRunningAppVersion();
  const knownFirmwareVersion =
    firmwareVersion || FirmwareStore.getFirmwareVersion();

  const __startUpdate = useCallback(async () => {
    if (!updateInfo) return;

    if (
      updateInfo.minFirmwareVersion &&
      (!knownFirmwareVersion ||
        compareVersions(updateInfo.minFirmwareVersion, knownFirmwareVersion) > 0)
    ) {
      setModalState(ModalState.ERROR_FIRMWARE_VERSION);
      return;
    }

    if (updateInfo.requiresStoreUpdate) {
      const storeUrl =
        Platform.OS === "ios"
          ? updateInfo.iosStoreUrl
          : updateInfo.androidStoreUrl;
      await Linking.openURL(
        storeUrl || "https://github.com/seasaltsaige/openwink/releases/"
      );
      close(false);
      return;
    }

    setModalState(ModalState.UPDATE);
    startUpdate();
  }, [updateInfo, knownFirmwareVersion, startUpdate, close]);

  useEffect(() => {
    if (modalState === ModalState.UPDATE && error !== ERROR_TYPE.ERR_NONE) {
      setModalState(ModalState.DESCRIPTION);
    }
  }, [modalState, error]);

  useEffect(() => {
    if (visible) {
      setModalState(ModalState.DESCRIPTION);
      Toast.hide();
    }
  }, [visible]);

  const __requestClose = () => {
    if (
      modalState === ModalState.UPDATE ||
      updateStatus === UPDATE_STATUS.INSTALLING
    )
      return;
    close(true);
  };

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={__requestClose}
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
            paddingVertical: 15,
            paddingHorizontal: 20,
            rowGap: 17,
          }}
        >
          {updateInfo !== null &&
            (modalState === ModalState.DESCRIPTION ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    columnGap: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_700Bold",
                      fontSize: 18,
                    }}
                  >
                    Update OpenWink App
                  </Text>
                </View>

                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    rowGap: 6,
                    width: "85%",
                  }}
                >
                  <Text
                    style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    Update v{updateInfo.version}
                  </Text>

                  <Text
                    style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_400Regular",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                    numberOfLines={10}
                  >
                    {updateInfo.description}
                  </Text>
                </View>

                <View
                  style={{
                    rowGap: 7,
                    marginTop: 5,
                  }}
                >
                  <Pressable
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? colorTheme.backgroundPrimaryColor
                        : colorTheme.buttonColor,
                      paddingHorizontal: 18,
                      paddingVertical: 6,
                      borderRadius: 20,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    })}
                    onPress={__startUpdate}
                  >
                    {() => (
                      <Text
                        style={{
                          textAlign: "center",
                          fontSize: 18,
                          fontFamily: "IBMPlexSans_500Medium",
                          color: colorTheme.headerTextColor,
                        }}
                      >
                        {updateInfo.requiresStoreUpdate
                          ? Platform.OS === "ios"
                            ? "Open App Store"
                            : "Open Play Store"
                          : "Install Update"}
                      </Text>
                    )}
                  </Pressable>

                  <Pressable onPress={() => close(true)}>
                    {({ pressed }) => (
                      <Text
                        style={{
                          textAlign: "center",
                          fontSize: 16,
                          fontFamily: "IBMPlexSans_500Medium",
                          color: pressed
                            ? colorTheme.buttonColor
                            : colorTheme.headerTextColor,
                          textDecorationLine: "underline",
                        }}
                      >
                        Not Now
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : modalState === ModalState.ERROR_FIRMWARE_VERSION ? (
              <>
                <Text
                  style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_700Bold",
                    fontSize: 18,
                    textAlign: "center",
                  }}
                >
                  Module Firmware Out of Date
                </Text>

                <Text
                  style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  Upgrading OpenWink App{"\n"}v{currentAppVersion} → v
                  {updateInfo.version}
                </Text>

                <Text
                  style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 14,
                    textAlign: "center",
                    width: "85%",
                  }}
                >
                  Module firmware v{updateInfo.minFirmwareVersion} is required
                  before proceeding with this app update.
                  {knownFirmwareVersion
                    ? ` (Current: v${knownFirmwareVersion})`
                    : " Please connect to your module and update its firmware first."}
                </Text>

                <View
                  style={{
                    rowGap: 7,
                    marginTop: 5,
                  }}
                >
                  {onRequestModuleUpdate && (
                    <Pressable
                      style={({ pressed }) => ({
                        backgroundColor: pressed
                          ? colorTheme.backgroundPrimaryColor
                          : colorTheme.buttonColor,
                        paddingHorizontal: 18,
                        paddingVertical: 6,
                        borderRadius: 20,
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      })}
                      onPress={() => {
                        close(false);
                        onRequestModuleUpdate();
                      }}
                    >
                      {() => (
                        <Text
                          style={{
                            textAlign: "center",
                            fontSize: 18,
                            fontFamily: "IBMPlexSans_500Medium",
                            color: colorTheme.headerTextColor,
                          }}
                        >
                          Update Module
                        </Text>
                      )}
                    </Pressable>
                  )}

                  <Pressable onPress={() => close(false)}>
                    {({ pressed }) => (
                      <Text
                        style={{
                          textAlign: "center",
                          fontSize: 16,
                          fontFamily: "IBMPlexSans_500Medium",
                          color: pressed
                            ? colorTheme.buttonColor
                            : colorTheme.headerTextColor,
                          textDecorationLine: "underline",
                        }}
                      >
                        Not Now
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                    }}
                  >
                    Installing App Update...
                  </Text>
                  <ActivityIndicator
                    color={colorTheme.buttonColor}
                    size="small"
                  />
                </View>

                <Text
                  style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  v{currentAppVersion} → v{updateInfo.version}
                </Text>

                <Text
                  style={{
                    marginTop: -6,
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  {updateInfo.description}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 5,
                  }}
                >
                  <IonIcons
                    name="warning-outline"
                    color={colorTheme.warning}
                    size={15}
                  />

                  <Text
                    style={{
                      color: colorTheme.warning,
                      fontFamily: "IBMPlexSans_400Regular",
                      fontSize: 10,
                    }}
                  >
                    The app will automatically restart once the update finishes
                  </Text>
                </View>
              </>
            ))}
        </View>
      </ModalBlurBackground>
    </Modal>
  );
}
