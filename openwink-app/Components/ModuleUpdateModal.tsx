import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { useColorTheme } from "../hooks/useColorTheme";
import { useBleMonitor } from "../Providers/BleMonitorProvider";
import { useOtaUpdate } from "../Providers/OTAUpdateProvider";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";

enum ModalState {
  DESCRIPTION,
  UPDATE,
}

interface IModuleUpdateModal {
  version: string;
  description: string;
  visible: boolean;
  binSizeBytes: number;
  startUpdate: () => Promise<void>;
  close: () => void;
}

export function ModuleUpdateModal({
  version,
  description,
  visible,
  binSizeBytes,
  close,
  startUpdate,
}: IModuleUpdateModal) {

  const { colorTheme } = useColorTheme();
  const { updateProgress, updatingStatus, firmwareVersion } = useBleMonitor();

  const [modalState, setModalState] = useState(ModalState.DESCRIPTION);

  const __startUpdate = () => {
    setModalState(ModalState.UPDATE);
    startUpdate();
  }

  const __requestClose = () => {
    if (modalState === ModalState.UPDATE) return;
    close();
  }

  const updateSizeKB = binSizeBytes / 1000;
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
            rowGap: 17
          }}
        >
          {
            modalState === ModalState.DESCRIPTION ? (
              <>
                <View style={{
                  flexDirection: "row",
                  columnGap: 10,
                }}>
                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 17,
                  }}>
                    Update Module Firmware
                  </Text>
                </View>



                <Text style={{
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 15,
                  textAlign: "center",
                }}>
                  Upgrade from
                  <Text
                    style={{
                      fontFamily: "IBMPlexSans_500Medium"
                    }}>
                    {" "}v{firmwareVersion}
                  </Text>
                  {" "}to{" "}
                  <Text
                    style={{
                      fontFamily: "IBMPlexSans_500Medium"
                    }}>
                    v{version || "Unknown"}
                  </Text>
                </Text>

                <Text style={{
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 14,
                  textAlign: "center",
                }}>
                  {description || "Unknown Description"}
                </Text>


                <View style={{
                  rowGap: 7,
                  marginTop: 5,
                }}>
                  <Pressable
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                      // width: "60%",
                      paddingHorizontal: 18,
                      paddingVertical: 6,
                      borderRadius: 20,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                    })}
                    onPress={__startUpdate}
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
                        Install Update
                      </Text>
                    }
                  </Pressable>


                  <Pressable
                    onPress={close}
                  // disabled={disableConfirmation}
                  >
                    {({ pressed }) =>
                      <Text
                        style={{
                          textAlign: "center",
                          fontSize: 17,
                          fontFamily: "IBMPlexSans_500Medium",
                          color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                          textDecorationLine: "underline"
                        }}
                      >
                        Not Now
                      </Text>
                    }
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {
                  updatingStatus === "Idle" ?
                    <View style={{
                      flexDirection: "row",
                      columnGap: 10,
                    }}>
                      <Text style={{
                        color: colorTheme.textColor,
                        fontFamily: "IBMPlexSans_500Medium",
                        fontSize: 16,
                      }}>
                        Connecting to Module...
                      </Text>
                      <ActivityIndicator size={"small"} color={colorTheme.buttonColor} />
                    </View>
                    :
                    <Text style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                    }}>
                      Updating Firmware... ({updateProgress}%)
                    </Text>
                }
                <View style={{
                  width: "100%",
                  marginHorizontal: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  position: "relative",
                }}>
                  <View style={{
                    width: "100%",
                    backgroundColor: `${colorTheme.disabledButtonColor}80`,
                    height: 16,
                    position: "absolute",
                    borderRadius: 10,
                  }} />
                  <View style={{
                    width: `${updateProgress}%`,
                    backgroundColor: colorTheme.buttonColor,
                    height: 16,
                    position: "absolute",
                    borderRadius: 10,
                  }} />
                </View>

                <Text style={{
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 14,
                  textAlign: "center",
                }}>
                  ({updateSizeKB ? ((updateSizeKB * updateProgress) / 100).toFixed(2) : "Unknown "}KB/{updateSizeKB ? (updateSizeKB).toFixed(2) : "Unknown "}KB) – {version ? `v${version}` : "Unkown Version"}
                </Text>

                <Text style={{
                  marginTop: -10,
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 14,
                  textAlign: "center"
                }}>
                  {description || "Unknown Description"}
                </Text>

                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  columnGap: 5,
                }}>
                  <IonIcons name="warning-outline" color={colorTheme.warning} size={17} />

                  <Text style={{
                    color: colorTheme.warning,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 11,
                    textAlign: "center"
                  }}>
                    Do not disconnect while module update is in progress
                  </Text>
                </View>
              </>
            )
          }
        </View>
      </ModalBlurBackground>
    </Modal>
  )
}