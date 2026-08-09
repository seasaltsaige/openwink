import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import { useBleMonitor } from "../Providers/BleMonitorProvider";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { useCallback, useEffect, useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import { UPDATE_STATUS, UpdateData, useUpdateManager } from "../hooks/useUpdateManager";
import { OTA } from "../helper/Handlers/OTA";
import { useBleConnection } from "../Providers/BleConnectionProvider";
import { AutoConnectStore } from "../Storage";
import { getVersion } from "react-native-device-info";
import { compareVersions, sleep } from "../helper/Functions";
import { useFocusEffect } from "@react-navigation/native";

enum ModalState {
  DESCRIPTION,
  UPDATE,
  WAITING,
  ERROR_APP_VERSION,
}

interface IModuleUpdateModal {
  visible: boolean;
  updateInfo: UpdateData[] | null,
  close: () => void;
}

export function ModuleUpdateModal({
  visible,
  updateInfo,
  close,
}: IModuleUpdateModal) {


  const { colorTheme } = useColorTheme();
  const { updateProgress, updatingStatus, firmwareVersion } = useBleMonitor();
  const { isConnected, isConnecting, isScanning, scanForModule, disconnect } = useBleConnection();
  const { startUpdate, updateStatus } = useUpdateManager();

  const [modalState, setModalState] = useState(ModalState.DESCRIPTION);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [updateData, setUpdateData] = useState(updateInfo as UpdateData[] | null);


  // const [prevUpdateStatus, setPrevUpdateStatus] = useState(updateStatus);

  const updateSizeKB = updateData !== null && updateData.length > 0 ? updateData[displayIndex].size / 1000 : 0;
  const version = updateData !== null && updateData.length > 0 ? updateData[displayIndex].version : "";
  const description = updateData !== null && updateData.length > 0 ? updateData[displayIndex].description : "";

  useEffect(() => {
    setUpdateData(updateInfo);
  }, [visible]);

  const totalUpdateCount = OTA.updateCount;

  const __startUpdate = useCallback(
    (index: number) => {
      if (updateData === null) return;

      // if the target app version is "larger" than the current version, then the current
      // app is out of date for the firmware update
      if (compareVersions(updateData![index].app_version, getVersion()) > 0)
        return setModalState(ModalState.ERROR_APP_VERSION);

      setModalState(ModalState.UPDATE);
      startUpdate(updateData![index].version);
    }, [updateData]
  );


  useEffect(() => {
    (async () => {
      // if update status updates to "up to date"
      // check to see where we are in the update queue
      if (updateStatus === UPDATE_STATUS.UP_TO_DATE) {

        // Updates not finished
        if (totalUpdateCount > 1 && displayIndex < (totalUpdateCount - 1))
          setModalState(ModalState.WAITING);
        else {
          // Udpates finished
          setDisplayIndex(0);
          setModalState(ModalState.DESCRIPTION);
          OTA.reset();

          close();
        }
      }
    })();
  }, [updateStatus, displayIndex]);


  // useEffect(() => {
  //   // if device connects while modal is in waiting state
  //   if (modalState === ModalState.WAITING && isConnected) {
  //     setDisplayIndex(displayIndex + 1);
  //     setModalState(ModalState.UPDATE);
  //     __startUpdate(displayIndex + 1);
  //   }
  // }, [isConnected, displayIndex]);


  const __requestClose = () => {
    if (modalState === ModalState.UPDATE || modalState === ModalState.WAITING) return;
    close();
  }

  useFocusEffect(() => {
    if (visible) setModalState(ModalState.ERROR_APP_VERSION);
  });

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
            updateData !== null && (
              modalState === ModalState.DESCRIPTION ? (
                <>
                  <View style={{
                    flexDirection: "row",
                    columnGap: 10,
                  }}>
                    <Text style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 18,
                    }}>
                      Update Module Firmware
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: totalUpdateCount > 1 ? "space-between" : "center",
                      width: "100%",
                    }}
                  >

                    <Pressable
                      hitSlop={10}
                      onPress={() => displayIndex > 0 ? setDisplayIndex(displayIndex - 1) : undefined}
                      disabled={displayIndex === 0}
                    >
                      {
                        ({ pressed }) => (
                          <IonIcons
                            name="chevron-back-outline"
                            size={24}
                            color={
                              displayIndex === 0 ?
                                colorTheme.disabledButtonColor :
                                pressed ?
                                  colorTheme.buttonColor :
                                  colorTheme.textColor} />
                        )
                      }
                    </Pressable>


                    <View
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        rowGap: 6,
                        width: "80%"
                      }}
                    >


                      <Text
                        style={{
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_400Regular",
                          fontSize: 16,
                          textAlign: "center",
                        }}
                      >
                        Update <Text style={{ fontFamily: "IBMPlexSans_500Medium" }}>v{updateData![displayIndex]?.version}</Text>
                      </Text>


                      <Text
                        style={{
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_400Regular",
                          fontSize: 15,
                          textAlign: "center",
                        }}
                        numberOfLines={10}
                      >
                        {updateData![displayIndex]?.description}
                      </Text>


                    </View>


                    <Pressable
                      hitSlop={10}
                      onPress={() => displayIndex < totalUpdateCount - 1 ? setDisplayIndex(displayIndex + 1) : undefined}
                      disabled={displayIndex === totalUpdateCount - 1}
                    >
                      {
                        ({ pressed }) => (
                          <IonIcons
                            name="chevron-forward-outline"
                            size={24}
                            color={
                              displayIndex === totalUpdateCount - 1 ?
                                colorTheme.disabledButtonColor :
                                pressed ?
                                  colorTheme.buttonColor :
                                  colorTheme.textColor} />
                        )
                      }
                    </Pressable>

                  </View>


                  <Text
                    style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_300Light",
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: -15,
                    }}>
                    {displayIndex + 1} / {totalUpdateCount}
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
                      onPress={() => __startUpdate(0)}
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
                          Install Update{totalUpdateCount > 1 ? "s" : ""}
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
              ) : modalState === ModalState.WAITING ? (
                <View style={{
                  rowGap: 5,
                }}>

                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_700Bold",
                    fontSize: 18,
                    textAlign: "center"
                  }}>
                    Module Rebooting
                  </Text>

                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 15,
                    marginVertical: 8,
                  }}>
                    <Text style={{
                      color: colorTheme.textColor,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 16,
                      textAlign: "center"
                    }}>
                      {isConnecting ? "Reconnecting to Module..." : isScanning ? "Scanning for Module..." : (isConnected || (!isConnected && !isConnecting && !isScanning)) ? "Disconnecting from Module..." : "Unknown State"}
                    </Text>

                    <ActivityIndicator color={colorTheme.buttonColor} size={"small"} />
                  </View>


                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 14,
                    textAlign: "center",
                    // width: "80%",
                  }}>
                    Update {displayIndex + 1}/{totalUpdateCount} successfully installed.{"\n"}Waiting for module to reconnect.
                  </Text>

                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 5,
                    marginTop: 10,
                  }}>
                    <IonIcons name="warning-outline" color={colorTheme.warning} size={17} />

                    <Text style={{
                      color: colorTheme.warning,
                      fontFamily: "IBMPlexSans_400Regular",
                      fontSize: 11,
                      textAlign: "center",
                    }}>
                      Do not close the app while updates are in progress
                    </Text>
                  </View>
                </View>
              ) : modalState === ModalState.ERROR_APP_VERSION ? (
                <>
                  {/* TODO: Error display for out of date app version. */}
                  {/* Updates should stop, and force the user to update the app before */}

                  {/* TODO: This needs some serious UI work before i am satisfied with this */}
                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 18,
                    textAlign: "center"
                  }}>
                    App Out of Date
                  </Text>

                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 15,
                    textAlign: "center"
                  }}>
                    Upgrading Module Firmware{"\n"}
                    <Text style={{
                      color: "#EED202"
                    }}>
                      v{firmwareVersion} → v{updateData![displayIndex].version}
                    </Text>
                  </Text>

                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 16,
                    textAlign: "center"
                  }}>
                    Please update the app from v{getVersion()} → v{updateData![displayIndex].app_version} before proceeding
                  </Text>


                  <Pressable
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                      paddingHorizontal: 18,
                      paddingVertical: 6,
                      borderRadius: 20,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                    })}
                    onPress={() => {
                      close();
                      /* TODO: Go to app store page in production, but rn just go to github release page */
                    }}
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
                        Update App
                      </Text>
                    }
                  </Pressable>


                </>
              ) : (
                <>

                  <Text style={{
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 16,
                  }}>
                    Updating Firmware... ({updateProgress}%)
                  </Text>


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
                    ({updateSizeKB ? ((updateSizeKB * updateProgress) / 100).toFixed(2) : "Unknown "}KB/{updateSizeKB ? (updateSizeKB).toFixed(2) : "Unknown "}KB) – {`v${version}`}
                  </Text>

                  <Text style={{
                    marginTop: -10,
                    color: colorTheme.textColor,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 14,
                    textAlign: "center"
                  }}>
                    {description}
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
                      Do not disconnect while module updates are in progress
                    </Text>
                  </View>
                </>
              )
            )}
        </View>
      </ModalBlurBackground>
    </Modal>
  )
}