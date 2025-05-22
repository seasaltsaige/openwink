import { useFocusEffect, useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Pressable, SafeAreaView, StatusBar, Text, View, } from "react-native"
import { ActivityIndicator } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../hooks/useBLE";
import { useCallback, useEffect, useState } from "react";

export function Home() {

  const navigate = useNavigation();
  const route = useRoute();
  const { colorTheme, update } = useColorTheme();

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
      const res = await checkAppUpdate();

    })();
  }, []);

  useEffect(() => {
    (async () => {

    })();
  }, [device !== null]);


  useFocusEffect(() => {

    (async () => {
      await update();
    })();

    return () => { };

  });

  const scanForDevice = async () => {
    const result = await requestPermissions();
    if (result) await scanForModule();
  }

  // <ion-icon name="cloud-download-outline"></ion-icon>
  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        rowGap: 25,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >

        <Text
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: colorTheme.headerTextColor,
            width: "100%",
          }}
        >Home</Text>

      </View>

      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 35,
          width: "100%",
        }}
      >

        {
          device ? (

            <View
              style={{
                backgroundColor: colorTheme.backgroundSecondaryColor,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 15,
                paddingVertical: 12,
                borderRadius: 7,
                width: "60%"
              }}
            >
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 15,
                }}
              >Connected to Wink Module</Text>

              <IonIcons name="checkmark-done-outline" size={20} color={colorTheme.headerTextColor} />

            </View>



          ) : (
            isScanning || isConnecting ? (
              <View
                style={{
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 15,
                  paddingVertical: 12,
                  borderRadius: 7,
                  width: "60%"
                }}
              >
                <Text
                  style={{
                    color: colorTheme.headerTextColor,
                    fontWeight: "bold",
                    fontSize: 15,
                  }}
                >{isScanning ? "Scanning for" : "Connecting to"} module</Text>
                <ActivityIndicator color={colorTheme.buttonColor} size="small" />
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 15,
                  paddingVertical: 12,
                  borderRadius: 7,
                  width: "60%"
                })}
                onPress={() => scanForDevice()}
              >
                <Text
                  style={{
                    color: colorTheme.headerTextColor,
                    fontWeight: "bold",
                    fontSize: 17,
                  }}
                >Scan for wink module</Text>

                <IonIcons name="wifi-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>
            )
          )
        }

        {/* COMMANDS */}
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            rowGap: 15,
          }}
        >

          <Text
            style={{
              alignSelf: "flex-start",
              textAlign: "left",
              color: colorTheme.headerTextColor,
              fontWeight: "500",
              fontSize: 20
            }}
          >
            Commands
          </Text>


          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 13,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => navigate.navigate("StandardCommands", { back: route.name })}
            key={1}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                name="color-wand-outline"
                size={25}
                color={colorTheme.headerTextColor}
              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 17,
                }}
              >Default Commands</Text>
            </View>
            <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 13,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => navigate.navigate("CustomCommands", { back: route.name })}
            key={2}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                name="sparkles-outline"
                size={25}
                color={colorTheme.headerTextColor}
              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 17,
                }}
              >Custom Commands</Text>
            </View>
            <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 13,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => navigate.navigate("CreateCustomCommands", { back: route.name })}
            key={3}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                name="construct-outline"
                size={25}
                color={colorTheme.headerTextColor}
              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 17,
                }}
              >Create Custom Commands</Text>
            </View>
            <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>
        </View>


        {/* QUICK LINKS */}
        <View
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            rowGap: 15,
          }}
        >

          <Text
            style={{
              alignSelf: "flex-start",
              textAlign: "left",
              color: colorTheme.headerTextColor,
              fontWeight: "500",
              fontSize: 20
            }}
          >
            Quick Links
          </Text>


          {/* CUSTOM WINK BUTTON */}
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 10,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => navigate.navigate("CustomWinkButton", { back: route.name })}
            key={4}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                name="speedometer-outline"
                size={20}
                color={colorTheme.headerTextColor}
              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >Set Up Custom Wink Button</Text>
            </View>
            <IonIcons name="chevron-forward-outline" size={15} color={colorTheme.headerTextColor} />
          </Pressable>

          {/* COLOR THEME */}
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
              width: "100%",
              padding: 5,
              paddingVertical: 10,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 8,
            })}
            //@ts-ignore
            onPress={() => navigate.navigate("Theme", { back: route.name })}
            key={5}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 10,
                marginLeft: 10,
              }}
            >

              <IonIcons
                name="color-fill-outline"
                size={20}
                color={colorTheme.headerTextColor}
              />
              <Text
                style={{
                  color: colorTheme.headerTextColor,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >Change App Theme</Text>
            </View>
            <IonIcons name="chevron-forward-outline" size={15} color={colorTheme.headerTextColor} />
          </Pressable>

        </View>


        {/* Status about app/module Updates + if update is available -> press = update */}
        <View
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "flex-start",
            rowGap: 10
          }}
        >

          <Text
            style={{
              alignSelf: "flex-start",
              textAlign: "left",
              color: colorTheme.headerTextColor,
              fontWeight: "500",
              fontSize: 18
            }}
          >
            Updates
          </Text>

          {
            // TODO: update to 'if update available for app'
            appUpdateAvailable ? (
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 15,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                })}
                onPress={() => {
                  // Open app store
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: colorTheme.textColor,
                    fontWeight: "600",
                  }}
                >
                  Install app update
                </Text>

                <IonIcons name="cloud-download-outline" color={colorTheme.textColor} size={18} />

              </Pressable>
            ) : (
              <View
                style={{
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 15,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: colorTheme.textColor,
                    fontWeight: "600",
                  }}
                >
                  {
                    fetchingAppUpdateInfo ?
                      "Checking for app update"
                      : "App is up to date"
                  }
                </Text>

                {
                  fetchingAppUpdateInfo ?
                    <ActivityIndicator size={"small"} color={colorTheme.buttonColor} />
                    : <IonIcons size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                }

              </View>
            )
          }

          {
            // TODO: update to 'if update available for module'
            moduleUpdateAvailable ? (
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 15,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                })}>

                <Text
                  style={{
                    fontSize: 15,
                    color: colorTheme.textColor,
                    fontWeight: "600",
                  }}
                >
                  Install module update
                </Text>

                <IonIcons name="cloud-download-outline" color={colorTheme.textColor} size={18} />
              </Pressable>
            ) : (
              <View

                style={{
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 15,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                }}
              >


                {/* TODO: maybe once ble stuff is set up, store last version number and compare on start... but also might be too complex, (too many layers), just search when connected... */}
                <Text
                  style={{
                    fontSize: 15,
                    color: colorTheme.textColor,
                    fontWeight: "600",
                  }}
                >
                  {
                    !device ?
                      "Connect to wink module for updates"
                      : fetchingModuleUpdateInfo ?
                        "Checking for module software update"
                        : "Module is up to date"
                  }
                </Text>


                {
                  !device ?
                    <IonIcons size={18} name="cloud-offline-outline" color={colorTheme.textColor} />
                    : fetchingModuleUpdateInfo ?
                      <ActivityIndicator size={"small"} color={colorTheme.buttonColor} />
                      : <IonIcons size={18} name="checkmark-done-outline" color={colorTheme.textColor} />
                }


              </View>
            )
          }


        </View>


      </View>

    </View >

  );
}