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
import { getDeviceUUID, sleep } from "../../helper/Functions";
import { OTA } from "../../helper/Handlers/OTA";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useBleConnection } from "../../Providers/BleConnectionProvider";
import { useBleCommand } from "../../Providers/BleCommandProvider";
import { useBleMonitor } from "../../Providers/BleMonitorProvider";

export function Home() {

  const navigate = useNavigation();
  const route = useRoute();
  const { colorTheme, theme } = useColorTheme();

  const [moduleUpdateAvailable, setModuleUpdateAvailable] = useState(false as null | boolean);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false as null | boolean);

  const [fetchingModuleUpdateInfo, setFetchingModuleUpdateInfo] = useState(false);
  const [fetchingAppUpdateInfo, setFetchingAppUpdateInfo] = useState(false);
  const [moduleUpdateCheckError, setModuleUpdateCheckError] = useState<string | null>(null);
  const [updateSize, setUpdateSize] = useState(0);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");

  const [installingFirmware, setInstallingFirmware] = useState(false);

  const [quickLinksModalVisible, setQuickLinksModalVisible] = useState(false);
  const [quickLinks, setQuickLinks] = useState(QuickLinksStore.getLinks());

  const {
    disconnect: disconnectFromModule,
    isConnecting,
    device,
    isScanning,
    requestPermissions,
    scanForModule,
  } = useBleConnection();

  const { isConnected } = useBleMonitor();

  const {
    startOTAService,
    sendOTAChunk,
    sendOTAComplete,
    sendOTASize,
  } = useBleCommand();

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
    try {
      setModuleUpdateCheckError(null); // Clear any previous errors
      const available = await OTA.fetchUpdateAvailable();

      setUpdateDescription(OTA.updateDescription);
      setUpdateVersion(OTA.latestVersion);
      setUpdateSize(OTA.getUpdateSize());

      setFetchingModuleUpdateInfo(false);

      if (available)
        setModuleUpdateAvailable(true);
      else
        setModuleUpdateAvailable(false);
    } catch (error) {
      setFetchingModuleUpdateInfo(false);
      setModuleUpdateAvailable(false);
      setModuleUpdateCheckError("error");

      const errorMessage = error instanceof Error ? error.message : 'Failed to check for updates';

      Toast.show({
        type: "error",
        autoHide: true,
        visibilityTime: 6000,
        text1: "Update Check Failed",
        text2: errorMessage
      });
    }
  }

  // TODO: Allow cancelation of update through button in modal and haltOTAUpdate
  const installModuleUpdate = async () => {
    if (!device) return;
    setInstallingFirmware(true);

    // const password = OTA.generateWifiPasskey();
    await startOTAService();
    // MTU Max size is 517, but that includes the headers/other needed data, so real max is 5 smaller
    const HEADER = 5;
    // TODO: handle low RSSI values
    // device.rssi
    const updateStatus = await OTA.updateFirmware(
      device.mtu - HEADER,
      sendOTAChunk,
      sendOTASize,
      sendOTAComplete,
    );

    setInstallingFirmware(false);

    if (updateStatus) {
      setModuleUpdateAvailable(false);
      setFetchingModuleUpdateInfo(false);
      Toast.show({
        text1: "Update Success",
        type: "success",
        text2: "Open Wink firmware update was installed successfully. The module will now restart to apply the firmware.",
        autoHide: true,
        visibilityTime: 8000,
      });
      return disconnectFromModule(false);
    } else {
      setModuleUpdateAvailable(false);
      setFetchingModuleUpdateInfo(false);
      Toast.show({
        type: "error",
        autoHide: true,
        visibilityTime: 8000,
        text1: "Update Failed",
        // TODO: if continued errors, suggest a bug report.
        text2: "Something went wrong while installing firmware. Please try again."
      });

      await fetchModuleUpdate();
    }
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
      if (isConnected) {
        setFetchingModuleUpdateInfo(true);
        await sleep(1000);
        fetchModuleUpdate();
      }
    })();
  }, [isConnected]);


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
                      {fetchingAppUpdateInfo ? "Checking for app update" : "App is up to date"}
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
              // TODO: update to 'if update available for module'
              installingFirmware ? (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      Installing Firmware Update
                    </Text>
                  </View>

                  <ActivityIndicator style={theme.mainLongButtonPressableIcon} size={"small"} color={colorTheme.buttonColor} />
                </View>
              ) : moduleUpdateCheckError ? (
                <Pressable
                  style={({ pressed }) => pressed ? { ...theme.mainLongButtonPressableContainer, opacity: 0.7 } : theme.mainLongButtonPressableContainer}
                  onPress={() => {
                    if (isConnected) {
                      setFetchingModuleUpdateInfo(true);
                      setModuleUpdateCheckError(null);
                      fetchModuleUpdate();
                    }
                  }}
                >
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={[theme.mainLongButtonPressableText, { color: '#ff6b6b' }]}>
                      Failed to check for Module updates
                    </Text>
                  </View>
                  <IonIcons style={theme.mainLongButtonPressableIcon} size={18} name="alert-circle-outline" color={'#ff6b6b'} />
                </Pressable>
              ) : moduleUpdateAvailable ? (
                <LongButton
                  onPress={() => installModuleUpdate()}
                  icons={{ names: [null, "cloud-download-outline"], size: [null, 18] }}
                  text="Install Firmware Update"
                />
              ) : (
                <View style={theme.mainLongButtonPressableContainer}>
                  <View style={theme.mainLongButtonPressableView}>
                    <Text style={theme.mainLongButtonPressableText}>
                      {!isConnected ?
                        "Connect to Wink Module for updates" :
                        fetchingModuleUpdateInfo ?
                          "Checking for Module software update" :
                          "Module is up to date"
                      }
                    </Text>
                  </View>
                  {
                    !isConnected ?
                      <IonIcons style={theme.mainLongButtonPressableIcon} size={18} name="cloud-offline-outline" color={colorTheme.textColor} /> :
                      fetchingModuleUpdateInfo ?
                        <ActivityIndicator style={theme.mainLongButtonPressableIcon} size={"small"} color={colorTheme.buttonColor} /> :
                        <IonIcons style={theme.mainLongButtonPressableIcon} size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                  }
                </View>
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
        onRequestClose={() => setInstallingFirmware(false)}
        visible={installingFirmware}
        binSizeBytes={updateSize}
        version={updateVersion}
        description={updateDescription}
      />
    </>
  );
}