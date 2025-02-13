import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Pressable, SafeAreaView, StatusBar, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useBLE } from "../hooks/useBLE";

export function Home() {

  const navigate = useNavigation();
  const route = useRoute();
  const { colorTheme } = useColorTheme();
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

  const scanForDevice = async () => {
    const result = await requestPermissions();
    if (result) await scanForDevice();
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
          rowGap: 60,
          // height: "75%"
        }}
      >


        <Pressable
          style={{

          }}
          onPress={() => { }}
        >
          <Text>Scan for module</Text>
          <IonIcons name="arrow-forward" />
        </Pressable>



        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 25,
          }}
        >


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
              >Create Custom Commands</Text>
            </View>
            <IonIcons name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
          </Pressable>
        </View>


        {/* Status about app/module Updates + if update is available -> press = update */}
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 40,
          }}
        >

          {
            // TODO: update to 'if update available'
            true ? (
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
                })}>

              </Pressable>
            ) : (
              <View

                style={{
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 5,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                }}
              >

              </View>
            )
          }


        </View>


      </View>

    </View >

  );
}