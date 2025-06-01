import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import ToggleSwitch from "toggle-switch-react-native";
import Tooltip from "react-native-walkthrough-tooltip";
import { CustomOEMButtonStore } from "../../../Storage";
import DisabledConnection from "../../../Components/DisabledConnection";


export function CustomWinkButton() {

  const { colorTheme } = useColorTheme();
  const { oemCustomButtonEnabled, setOEMButtonStatus, buttonDelay, updateButtonDelay } = useBLE();
  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back, backHumanReadable } = route.params;

  const [intervalTooltipVisible, setIntervalTooltipVisible] = useState(false);
  const [intervalValue, setIntervalValue] = useState(500);


  const { device, isScanning, isConnecting } = useBLE();

  const saveInterval = async () => {
    await updateButtonDelay(intervalValue);
  }

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const setValue = await CustomOEMButtonStore.getDelay();
        if (setValue !== null)
          setIntervalValue(setValue);
      })();
    }, []),
  );

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
        rowGap: 15,
      }}
    >

      <View
        style={{
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
          paddingHorizontal: 20,
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

      <View
        style={{
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: 15,
        }}
      >



        {/* Press Interval */}
        <Tooltip
          isVisible={intervalTooltipVisible}
          // backgroundColor={colorTheme.backgroundSecondaryColor}
          closeOnBackgroundInteraction
          closeOnContentInteraction
          placement="bottom"
          onClose={() => setIntervalTooltipVisible(false)}
          contentStyle={{
            backgroundColor: colorTheme.backgroundSecondaryColor
          }}
          content={
            <View>
              <Text style={{
                color: colorTheme.textColor,
                textAlign: "center",
                fontWeight: "500"
              }}>
                Maximum time allowed between retractor button presses {"\n"}
                before a sequence takes effect. Between 250ms and 500ms {"\n"}
                is recommended.
              </Text>
            </View>
          }
        >

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              columnGap: 10,
            }}
          >
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "600",
                fontSize: 22,
              }}
            >
              Press Interval
            </Text>
            <Pressable
              hitSlop={20}
              onPress={() => setIntervalTooltipVisible(true)}
            >
              {
                ({ pressed }) => (
                  <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
                )
              }
            </Pressable>
          </View>
        </Tooltip>

        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            rowGap: 12,
            width: "90%",
          }}
        >
          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontWeight: "500",
              fontSize: 19,
            }}
          >
            Current Maximum: {buttonDelay}ms
          </Text>

          <View style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 20,
          }}>
            <TextInput
              // defaultValue={intervalValue.toString()}
              keyboardType="numeric"
              placeholder="Interval in ms"
              placeholderTextColor="grey"
              editable={device !== null}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (isNaN(num)) return;
                else setIntervalValue(num);
              }}
              style={{
                backgroundColor: colorTheme.backgroundSecondaryColor,
                // padding: 15,
                height: 40,
                borderRadius: 3,
                width: "33%",
                color: colorTheme.textColor,
                textAlign: "center",
                // margin: 15,
              }}
            />

            <Pressable
              onPress={() => saveInterval()}
              style={({ pressed }) => ({
                backgroundColor: !device ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                height: 40,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                borderRadius: 7,
              })}
              disabled={!device}
            >
              <Text
                style={{
                  color: colorTheme.buttonTextColor,
                  fontSize: 18,
                  fontWeight: "500",
                }}
              >
                Save
              </Text>
            </Pressable>
          </View>

        </View>

        <ScrollView>
          {/* TODO: Add list view of custom actions (1-10), along with button to add new action, (each action has edit/remove option) */}
        </ScrollView>


        {/* <DisabledConnection
          name="Custom Button"
        /> */}
      </View>

    </View>
  )

}