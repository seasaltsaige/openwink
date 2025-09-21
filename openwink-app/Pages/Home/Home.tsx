import { useFocusEffect, useNavigation, useNavigationState, useRoute, useTheme } from "@react-navigation/native";
import { Pressable, SafeAreaView, ScrollView, StatusBar, Text, View, } from "react-native"
import { ActivityIndicator } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import Octicons from "@react-native-vector-icons/octicons";
import { useBLE } from "../../hooks/useBLE";
import { useCallback, useEffect, useState } from "react";
import { AutoConnectStore, QuickLinksStore } from "../../Storage";
import { EditQuickLinksModal, LongButton, QuickLink } from "../../Components";
import { MainHeader } from "../../Components";
import { getDeviceUUID } from "../../helper/Functions";
// import { EditQuickLinksModal, QuickLink } from "../../Components/EditQuickLinksModal";

export function Home() {

  const navigate = useNavigation();
  const route = useRoute();
  const { colorTheme, theme } = useColorTheme();

  const [moduleUpdateAvailable, setModuleUpdateAvailable] = useState(false as null | boolean);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false as null | boolean);

  const [fetchingModuleUpdateInfo, setFetchingModuleUpdateInfo] = useState(false);
  const [fetchingAppUpdateInfo, setFetchingAppUpdateInfo] = useState(false);

  const [quickLinksModalVisible, setQuickLinksModalVisible] = useState(false);
  const [quickLinks, setQuickLinks] = useState(QuickLinksStore.getLinks());

  const {
    device,
    disconnectFromModule,
    firmwareVersion,
    headlightsBusy,
    isConnecting,
    isScanning,
    autoConnectEnabled,
    oemCustomButtonEnabled,
    sendDefaultCommand,
    setAutoConnect,
    setOEMButtonStatus,
    leftStatus,
    mac,
    manager,
    requestPermissions,
    rightStatus,
    scanForModule,
    setHeadlightsBusy,
    updateProgress,
    updatingStatus
  } = useBLE();

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
    console.log("Fetching firmware version");
  }

  const installModuleUpdate = async () => {

  }

  useEffect(() => {
    getDeviceUUID();
    const autoConn = AutoConnectStore.get();
    if (autoConn && !device) scanForDevice();
    (async () => {
      const res = await checkAppUpdate();
    })();
  }, []);

  const scanForDevice = async () => {
    const result = await requestPermissions();
    if (result) await scanForModule();
  }

  return (
    <View style={theme.container}>
      <MainHeader text="Home" />

      <ScrollView contentContainerStyle={theme.contentContainer} >

        {
          device ? (
            // <View style={theme.homeScreenConnectionButton}>
            //   <Text style={theme.mainLongButtonPressableText}>
            //     Connected to Module
            //   </Text>
            //   <IonIcons name="checkmark-done-outline" size={25} color={colorTheme.headerTextColor} />
            // </View>

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
            moduleUpdateAvailable ? (
              <LongButton
                onPress={() => {
                  // Install update to wink module
                  // Should only become this state if connected to wink module (To check device for version)
                }}
                icons={{ names: [null, "cloud-download-outline"], size: [null, 18] }}
                text="Install Module Update"
              />

            ) : (
              <View style={theme.mainLongButtonPressableContainer}>
                <View style={theme.mainLongButtonPressableView}>
                  <Text style={theme.mainLongButtonPressableText}>
                    {!device ?
                      "Connect to Wink Module for updates" :
                      fetchingModuleUpdateInfo ?
                        "Checking for Module software update" :
                        "Module is up to date"
                    }
                  </Text>
                </View>
                {
                  !device ?
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

      <EditQuickLinksModal
        close={() => setQuickLinksModalVisible(false)}
        visible={quickLinksModalVisible}
        initialLinks={quickLinks}
        onUpdateLinks={(updatedLinks) => updateQuickLinks(updatedLinks)}
      />
    </View>
  );
}