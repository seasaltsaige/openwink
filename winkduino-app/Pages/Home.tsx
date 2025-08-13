import { useFocusEffect, useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Pressable, SafeAreaView, ScrollView, StatusBar, Text, View, } from "react-native"
import { ActivityIndicator } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../hooks/useBLE";
import { useCallback, useEffect, useState } from "react";
import { AutoConnectStore } from "../Storage";

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

      <View style={theme.headerContainer}>
        <Text style={theme.headerText}>Home</Text>
      </View>

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
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => navigate.navigate("StandardCommands", { back: route.name })}
            key={1}
          >
            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name="color-wand-outline" size={25} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Default Commands
              </Text>
            </View>
            <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />

          </Pressable>
          {/* Custom Commands */}
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => navigate.navigate("CustomCommands", { back: route.name })}
            key={2}
          >
            <View style={theme.mainLongButtonPressableView}>

              <IonIcons name="sparkles-outline" size={25} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Custom Commands
              </Text>
            </View>
            <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>
          {/* Create Custom Command */}
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => navigate.navigate("CreateCustomCommands", { back: route.name })}
            key={3}
          >
            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name="construct-outline" size={25} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Create Custom Commands
              </Text>
            </View>
            <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>
        </View>


        {/* QUICK LINKS */}
        <View style={theme.homeScreenButtonsContainer}>
          <Text style={theme.labelHeader}>
            Quick Links
          </Text>
          {/* CUSTOM WINK BUTTON */}
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => navigate.navigate("CustomWinkButton", { back: route.name, backHumanReadable: "Home" })}
            key={4}
          >
            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name="speedometer-outline" size={20} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Set Up Custom Wink Button
              </Text>
            </View>
            <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />

          </Pressable>

          {/* COLOR THEME */}
          <Pressable
            style={({ pressed }) => pressed ? theme.mainLongButtonPressableContainerPressed : theme.mainLongButtonPressableContainer}
            //@ts-ignore
            onPress={() => navigate.navigate("Theme", { back: route.name })}
            key={5}
          >
            <View style={theme.mainLongButtonPressableView}>
              <IonIcons name="color-fill-outline" size={20} color={colorTheme.headerTextColor} />
              <Text style={theme.mainLongButtonPressableText}>
                Change App Theme
              </Text>
            </View>
            <IonIcons style={theme.mainLongButtonPressableIcon} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>

        </View>


        {/* Status about app/module Updates + if update is available -> press = update */}
        <View style={theme.homeScreenButtonsContainer}>
          <Text style={theme.labelHeader}>
            Updates
          </Text>

          {
            // TODO: update to 'if update available for app'
            appUpdateAvailable ? (
              <Pressable
                style={({ pressed }) => pressed ? theme.homeUpdatesButtonPressed : theme.homeUpdatesButton}
                onPress={() => {
                  // Open app store
                }}
              >
                <Text style={theme.mainLongButtonPressableText}>
                  Install app update
                </Text>
                <IonIcons name="cloud-download-outline" color={colorTheme.textColor} size={18} />

              </Pressable>
            ) : (
              <View style={theme.homeUpdatesButton}>
                <Text style={theme.homeUpdatesText}>
                  {fetchingAppUpdateInfo ? "Checking for app update" : "App is up to date"}
                </Text>

                {
                  fetchingAppUpdateInfo ?
                    <ActivityIndicator size={"small"} color={colorTheme.buttonColor} /> :
                    <IonIcons size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                }

              </View>
            )
          }

          {
            // TODO: update to 'if update available for module'
            moduleUpdateAvailable ? (
              <Pressable
                style={({ pressed }) => pressed ? theme.homeUpdatesButtonPressed : theme.homeUpdatesButton}
                onPress={() => {
                  // Install update to wink module
                  // Should only become this state if connected to wink module (To check device for version)
                }}
              >
                <Text style={theme.homeUpdatesText}>
                  Install module update
                </Text>
                <IonIcons name="cloud-download-outline" color={colorTheme.textColor} size={18} />
              </Pressable>
            ) : (
              <View style={theme.homeUpdatesButton}>
                {/* TODO: maybe once ble stuff is set up, store last version number and compare on start... but also might be too complex, (too many layers), just search when connected... */}
                <Text style={theme.homeUpdatesText}>
                  {!device ?
                    "Connect to Wink Module for updates" :
                    fetchingModuleUpdateInfo ?
                      "Checking for Module software update" :
                      "Module is up to date"
                  }
                </Text>
                {
                  !device ?
                    <IonIcons size={18} name="cloud-offline-outline" color={colorTheme.textColor} /> :
                    fetchingModuleUpdateInfo ?
                      <ActivityIndicator size={"small"} color={colorTheme.buttonColor} /> :
                      <IonIcons size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                }
              </View>
            )
          }
        </View>
      </ScrollView>
    </View >
  );
}