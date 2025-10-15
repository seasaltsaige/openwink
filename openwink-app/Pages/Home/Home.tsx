import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View, ActivityIndicator } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import IonIcons from "@expo/vector-icons/Ionicons";
import Octicons from "@react-native-vector-icons/octicons";

import { AutoConnectStore, QuickLinksStore } from "../../Storage";
import {
  EditQuickLinksModal,
  LongButton,
  QuickLink,
  ModuleUpdateModal,
  MainHeader
} from "../../Components";
import { getDeviceUUID } from "../../helper/Functions";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useBleConnection } from "../../Providers/BleConnectionProvider";

import {
  useUpdateManager,
  ERROR_TYPE,
  UPDATE_STATUS,
} from "../../hooks/useUpdateManager";

export function Home() {

  const navigate = useNavigation();
  const route = useRoute();
  const { colorTheme, theme } = useColorTheme();

  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false as null | boolean);
  const [fetchingAppUpdateInfo, setFetchingAppUpdateInfo] = useState(false);

  const [quickLinksModalVisible, setQuickLinksModalVisible] = useState(false);
  const [quickLinks, setQuickLinks] = useState(QuickLinksStore.getLinks());

  const {
    disconnect: disconnectFromModule,
    isConnecting,
    device,
    isScanning,
    isConnected,
    requestPermissions,
    scanForModule,
  } = useBleConnection();

  const {
    updateStatus,
    updateData,
    error,
    stopUpdate,
    checkUpdateAvailable,
    startUpdate,
  } = useUpdateManager({
    onError: ({ errorType, errorMessage, errorTitle }) => {

    },
    onSuccess: ({ successMessage, successTitle, successType }) => {

    },
  });

  const updatePanelVisible =
    error === ERROR_TYPE.ERR_NONE &&
    updateData !== null &&
    updateStatus === UPDATE_STATUS.INSTALLING;


  const updateQuickLinks = (newQuickLinks: QuickLink[]) => {
    QuickLinksStore.setLinks(newQuickLinks);
    setQuickLinks(() => newQuickLinks);
  }

  const checkAppUpdate = async () => {
    // fetch request to get app update info

  }

  const installAppUpdate = async () => {

  }

  const fetchModuleUpdate = async () => {
    if (!device) return;
    await checkUpdateAvailable();
  }

  const installModuleUpdate = async () => {
    await startUpdate();
  }

  const scanForDevice = async () => {
    const result = await requestPermissions();
    if (result) await scanForModule();
  }

  useEffect(() => {
    getDeviceUUID();
    const autoConn = AutoConnectStore.get();
    if (autoConn && !isConnected) scanForDevice();
    (async () => {
      await checkAppUpdate();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (device !== null) {
        fetchModuleUpdate();
      }
    })();
  }, [device]);


  return (
    <>
      <SafeAreaView style={theme.tabContainer}>
        <MainHeader text="Home" />

        <ScrollView contentContainerStyle={theme.contentContainer} >

          {
            isConnected ? (
              <Pressable
                style={({ pressed }) => pressed ? theme.homeScreenConnectionButtonPressed : theme.homeScreenConnectionButton}
                onPress={() => disconnectFromModule()}
              >
                <Text style={theme.homeScreenConnectionButtonText}>
                  Connected to Module
                </Text>
                <IonIcons name="checkmark-done-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>

            ) : (
              isScanning || isConnecting ? (
                <View style={theme.homeScreenConnectionButton}>
                  <Text style={theme.homeScreenConnectionButtonText}>
                    {isScanning ? "Scanning for" : "Connecting to"} Module
                  </Text>
                  <ActivityIndicator color={colorTheme.buttonColor} size="small" />
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => pressed ? theme.homeScreenConnectionButtonPressed : theme.homeScreenConnectionButton}
                  onPress={() => scanForDevice()}
                >
                  <Text style={theme.homeScreenConnectionButtonText}>
                    Scan for Wink Module
                  </Text>

                  <IonIcons name="wifi-outline" size={20} color={colorTheme.headerTextColor} />
                </Pressable>
              )
            )
          }

          {/* COMMANDS */}
          <View style={theme.homeScreenButtonsContainer}>
            <Text style={theme.labelHeader}>
              Commands
            </Text>

            {/* Standard Commands */}
            <LongButton
              //@ts-ignore
              onPress={() => navigate.navigate("StandardCommands", { back: route.name })}
              key={"StandardCommands"}
              icons={{ names: ["color-wand-outline", "chevron-forward-outline"], size: [25, 20] }}
              text="Default Commands"
            />

            {/* Custom Commands */}
            <LongButton
              //@ts-ignore
              onPress={() => navigate.navigate("CustomCommands", { back: route.name })}
              key={"CustomCommands"}
              icons={{ names: ["sparkles-outline", "chevron-forward-outline"], size: [25, 20] }}
              text="Custom Commands"
            />

            {/* Create Custom Command */}
            <LongButton
              //@ts-ignore
              onPress={() => navigate.navigate("CreateCustomCommands", { back: route.name })}
              key={"CreateCustomCommands"}
              icons={{ names: ["construct-outline", "chevron-forward-outline"], size: [25, 20] }}
              text="Create Custom Commands"
            />
          </View>

          <View style={[theme.homeScreenButtonsContainer, { rowGap: 10, }]}>
            {/* QUICK LINKS HEADER */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}>
              <Text style={theme.labelHeader}>
                Quick Links
              </Text>

              {/* EDIT Button */}
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 8
                }}
                hitSlop={10}
                onPress={() => setQuickLinksModalVisible(true)}
              >
                {
                  ({ pressed }) =>
                    <>
                      <Text style={{
                        color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                        fontSize: 15,
                        fontFamily: "IBMPlexSans_500Medium",

                      }}>
                        Edit
                      </Text>
                      <Octicons style={{ marginTop: 3 }} name="sliders" size={17} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                    </>
                }
              </Pressable>
            </View>

            {
              quickLinks.length > 0 ?
                quickLinks.map((link) => (
                  <LongButton
                    key={link.title}
                    //@ts-ignore
                    onPress={() => navigate.navigate(link.navigation.page, { back: link.navigation.back, backHumanReadable: link.navigation.backHumanReadable })}
                    icons={{ names: [link.icon, "chevron-forward-outline"], size: [20, 20] }}
                    text={link.title}
                  />
                ))
                : <Text style={[theme.labelHeader, { alignSelf: "center", width: "100%", fontSize: 16 }]}>
                  No Quick Links Selected
                </Text>
            }
          </View>




          {/* Status about app/module Updates + if update is available -> press = update */}
          <View style={theme.homeScreenButtonsContainer}>
            <Text style={theme.labelHeader}>
              Updates
            </Text>

            {
              // TODO: update to 'if update available for app'
              appUpdateAvailable ? (
                <LongButton
                  onPress={() => {
                    // Open app store
                  }}
                  icons={{ names: [null, "cloud-download-outline"], size: [null, 18] }}
                  text="Install App Update"
                />
              ) : (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      {
                        fetchingAppUpdateInfo ?
                          "Checking for app update" :
                          "App is up to date"}
                    </Text>
                  </View>
                  {
                    fetchingAppUpdateInfo ?
                      <ActivityIndicator style={theme.mainLongButtonPressableIcon} size={"small"} color={colorTheme.buttonColor} /> :
                      <IonIcons style={theme.mainLongButtonPressableIcon} size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                  }

                </View>
              )
            }

            {
              // FIRST: Error Status should take priority
              error !== ERROR_TYPE.ERR_NONE ? (
                error === ERROR_TYPE.ERR_TIMEOUT ? (
                  // Specific case for timeout during fetch
                  <LongButton
                    text="Failed to check for Module updates"
                    onPress={() => { if (device !== null) fetchModuleUpdate() }}
                    icons={{ names: [null, "alert-circle-outline"], size: [null, 18] }}
                  />
                ) : (
                  <View style={theme.mainLongButtonPressableContainer}>
                    <View style={theme.mainLongButtonPressableView}>
                      <Text style={theme.mainLongButtonPressableText}>
                        Failed to Install Firmware
                      </Text>
                    </View>

                    <IonIcons style={theme.mainLongButtonPressableIcon} size={20} name="alert-circle-outline" color='#ff6b6b' />
                  </View>
                )
              ) : (updateStatus === UPDATE_STATUS.IDLE && !device) ? (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      Connect to Wink Module for updates
                    </Text>
                  </View>
                  <IonIcons style={theme.mainLongButtonPressableIcon} size={18} name="cloud-offline-outline" color={colorTheme.textColor} />
                </View>
              ) : updateStatus === UPDATE_STATUS.AVAILABLE ? (
                <LongButton
                  onPress={() => installModuleUpdate()}
                  icons={{ names: [null, "cloud-download-outline"], size: [null, 18] }}
                  text="Install Firmware Update"
                />
              ) : updateStatus === UPDATE_STATUS.UP_TO_DATE ? (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      Module is up to date
                    </Text>
                  </View>
                  <IonIcons style={theme.mainLongButtonPressableIcon} size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                </View>
              ) : updateStatus === UPDATE_STATUS.INSTALLING ? (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      Installing Firmware Update
                    </Text>
                  </View>
                  <ActivityIndicator style={theme.mainLongButtonPressableIcon} size={"small"} color={colorTheme.buttonColor} />
                </View>
              ) : updateStatus === UPDATE_STATUS.FETCHING ? (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      Checking for Module Update
                    </Text>
                  </View>
                  <ActivityIndicator style={theme.mainLongButtonPressableIcon} size={"small"} color={colorTheme.buttonColor} />
                </View>
              ) : (
                // UNKNOWN STATE: SHOULD NOT REACH
                <LongButton
                  onPress={() => installModuleUpdate()}
                  icons={{ names: [null, "alarm-outline"], size: [null, 18] }}
                  text="Unknown Update State: Report Here"
                />
              )
            }
          </View>

        </ScrollView>

      </SafeAreaView>

      <EditQuickLinksModal
        close={() => setQuickLinksModalVisible(false)}
        visible={quickLinksModalVisible}
        initialLinks={quickLinks}
        onUpdateLinks={(updatedLinks) => updateQuickLinks(updatedLinks)}
      />

      <ModuleUpdateModal
        visible={updatePanelVisible}
        binSizeBytes={updateData?.size!}
        description={updateData?.description!}
        version={updateData?.version!}
        stopUpdate={stopUpdate}
      />
    </>
  );
}