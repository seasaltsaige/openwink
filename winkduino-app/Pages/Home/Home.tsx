import { useFocusEffect, useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Pressable, SafeAreaView, ScrollView, StatusBar, Text, View, } from "react-native"
import { ActivityIndicator } from "react-native";
import { useColorTheme } from "../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../../hooks/useBLE";
import { useCallback, useEffect, useState } from "react";
import { AutoConnectStore } from "../../Storage";
import { LongButton } from "../../Components/LongButton";
import { MainHeader } from "../../Components/MainHeader";

export function Home() {

  const navigate = useNavigation();
  const route = useRoute();
  const { colorTheme, update, theme } = useColorTheme();

  const [moduleUpdateAvailable, setModuleUpdateAvailable] = useState(false as null | boolean);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false as null | boolean);

  const [fetchingModuleUpdateInfo, setFetchingModuleUpdateInfo] = useState(false);
  const [fetchingAppUpdateInfo, setFetchingAppUpdateInfo] = useState(false);

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
    (async () => {
      const autoConn = await AutoConnectStore.get();
      if (autoConn && !device) scanForDevice();

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
            <View style={theme.homeScreenConnectionButton}>
              <Text style={theme.homeScreenConnectionButtonText}>
                Connected to Module
              </Text>
              <IonIcons name="checkmark-done-outline" size={20} color={colorTheme.headerTextColor} />
            </View>
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


        {/* QUICK LINKS */}
        <View style={theme.homeScreenButtonsContainer}>
          <Text style={theme.labelHeader}>
            Quick Links
          </Text>
          {/* CUSTOM WINK BUTTON */}
          <LongButton
            //@ts-ignore
            onPress={() => navigate.navigate("CustomWinkButton", { back: route.name, backHumanReadable: "Home" })}
            key={"CustomWinkButton"}
            icons={{ names: ["speedometer-outline", "chevron-forward-outline"], size: [20, 20] }}
            text="Set Up Custom Wink Button"
          />
          {/* COLOR THEME */}
          <LongButton
            //@ts-ignore
            onPress={() => navigate.navigate("Theme", { back: route.name })}
            key={"Theme"}
            icons={{ names: ["color-fill-outline", "chevron-forward-outline"], size: [20, 20] }}
            text="Change App Theme"
          />
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
    </View >
  );
}