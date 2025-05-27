import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import ToggleSwitch from "toggle-switch-react-native";


export function CustomWinkButton() {

  const { colorTheme } = useColorTheme();
  const { oemCustomButtonEnabled, setOEMButtonStatus } = useBLE();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const { device, isScanning, isConnecting } = useBLE();

  return (
    <View
      style={{
        backgroundColor: colorTheme.backgroundPrimaryColor,
        height: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        rowGap: 25,
      }}
    >

      <View style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>

        <Pressable style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          columnGap: 10,
          height: "100%"
        }}
          onPress={() => navigation.goBack()}
        >
          {
            ({ pressed }) => (
              <>
                <IonIcons name="chevron-back-outline" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={23} />

                <Text style={{
                  color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  fontWeight: "500",
                  fontSize: 20
                }}>{backHumanReadable}</Text>


                {
                  device ? (
                    <IonIcons name="wifi-outline" color="#367024" size={21} />
                  ) : (
                    isConnecting || isScanning ?
                      <ActivityIndicator color={colorTheme.buttonColor} />
                      : (
                        <IonIcons name="cloud-offline-outline" color="#b3b3b3" size={23} />
                      )
                  )
                }
              </>
            )
          }
        </Pressable>


        <Text style={{
          fontSize: 25,
          fontWeight: "600",
          color: colorTheme.headerTextColor,
          width: "auto",
          marginRight: 10,
        }}
        >Custom Button</Text>

      </View>

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
          paddingHorizontal: 10,
        }}
      >

        <Text
          style={{
            color: colorTheme.headerTextColor,
            fontWeight: "bold",
            fontSize: 17,
          }}
        >{oemCustomButtonEnabled ? "Disable" : "Enable"} Custom Button</Text>
        <ToggleSwitch
          onColor={!device ? colorTheme.disabledButtonColor : colorTheme.buttonColor}
          offColor={colorTheme.disabledButtonColor}
          isOn={oemCustomButtonEnabled}
          size="medium"
          hitSlop={10}
          disabled={!device}
          circleColor={colorTheme.buttonTextColor}
          onToggle={async (isOn) => await setOEMButtonStatus(isOn ? "enable" : "disable")}
        />
      </View>


      <ScrollView>

      </ScrollView>

    </View>
  )

}