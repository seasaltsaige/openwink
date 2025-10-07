import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import IonIcons from "@expo/vector-icons/Ionicons";
import DeviceInfo from "react-native-device-info";
import * as Application from "expo-application";

import { useColorTheme } from "../../hooks/useColorTheme";
import { HeaderWithBackButton, InfoBox, TooltipHeader } from "../../Components";
import { MockBleStore } from "../../Storage";
import { getDeviceUUID } from "../../helper/Functions";

export function DeveloperSettings() {
  const { colorTheme, theme } = useColorTheme();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const [mockBleEnabled, setMockBleEnabled] = useState(MockBleStore.get());
  const isSimulator = DeviceInfo.isEmulatorSync();

  const devInfo = useMemo(() => ({
    "Application ID": getDeviceUUID(),
    "Application Version": `v${Application.nativeApplicationVersion}`,
    "Platform": DeviceInfo.getSystemName(),
    "Is Emulator": isSimulator ? 'Yes' : 'No',
    "Mock BLE Active": mockBleEnabled ? 'Yes' : 'No',
  }), [Application.nativeApplicationVersion, isSimulator, mockBleEnabled]);

  useEffect(() => {
    // Load the current setting
    setMockBleEnabled(MockBleStore.get());
  }, []);

  const handleToggleMockBle = (value: boolean) => {
    if (isSimulator) {
      // Show alert that mock is always enabled in simulator
      Alert.alert(
        "Simulator Mode",
        "Mock BLE is always enabled when running in a simulator. This setting only affects physical devices in development mode.",
        [{ text: "OK" }]
      );
      return;
    }

    setMockBleEnabled(value);
    MockBleStore.set(value);
    
    // Show restart alert
    Alert.alert(
      "Restart Required",
      "You need to restart the app for this change to take effect.",
      [
        {
          text: "OK",
          style: "default"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="Dev Settings"
        headerTextStyle={theme.settingsHeaderText}
      />

      <ScrollView>
        {/* Disclaimer */}
        <View style={theme.contentContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <IonIcons name="warning-outline" size={20} color={colorTheme.buttonColor} style={{ marginRight: 8 }} />
            <Text style={[theme.subSettingHeaderText, { color: colorTheme.buttonColor }]}>
              Development Only
            </Text>
          </View>
          <Text style={theme.text}>
            These settings are only available in development mode and will not appear in production builds.
          </Text>
        </View>

        {/* Device Info */}
        <InfoBox title="Developer Info" data={devInfo} />

        {/* Mock BLE Settings */}
        <View style={theme.contentContainer}>
          <TooltipHeader
            tooltipTitle="Mock BLE Manager"
            tooltipContent={
              <Text style={theme.tooltipContainerText}>
                Use a simulated Bluetooth Low Energy manager instead of the real one. This allows testing the app without a physical device. The mock BLE system maintains state between app restarts, including headlight positions and custom button configurations.
              </Text>
            }
          />
          
          {isSimulator && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: colorTheme.backgroundSecondaryColor, borderRadius: 8 }}>
              <IonIcons name="information-circle" size={18} color={colorTheme.textColor} style={{ marginRight: 8 }} />
              <Text style={[theme.text, { flex: 1, fontSize: 13 }]}>
                Mock BLE is always enabled in simulator
              </Text>
            </View>
          )}

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            padding: 16,
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 12,
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[theme.settingsHeaderText, { fontSize: 16 }]}>
                Enable Mock BLE
              </Text>
            </View>
            <Switch
              value={mockBleEnabled}
              onValueChange={handleToggleMockBle}
              trackColor={{ false: colorTheme.disabledButtonColor, true: colorTheme.buttonColor }}
              thumbColor={colorTheme.backgroundPrimaryColor}
              disabled={isSimulator}
            />
          </View>
        </View>

        {/* Mock BLE State Reset */}
        {(mockBleEnabled || isSimulator) && (
          <View style={theme.contentContainer}>
            <Text style={theme.subSettingHeaderText}>
              Mock BLE State
            </Text>
            
            <Pressable
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 14,
                  backgroundColor: pressed ? colorTheme.disabledButtonColor : colorTheme.backgroundSecondaryColor,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colorTheme.buttonColor,
                }
              ]}
              onPress={() => {
                Alert.alert(
                  "Reset Mock BLE State",
                  "This will clear all saved mock BLE data and restart the app with default values. Continue?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Reset",
                      style: "destructive",
                      onPress: () => {
                        MockBleStore.clearState();
                        Alert.alert(
                          "State Cleared",
                          "Mock BLE state has been reset. Please restart the app to apply changes.",
                          [{ text: "OK" }]
                        );
                      }
                    }
                  ]
                );
              }}
            >
              <IonIcons name="refresh-outline" color={colorTheme.buttonColor} size={20} style={{ marginRight: 8 }} />
              <Text style={[theme.settingsHeaderText, { color: colorTheme.buttonColor, fontSize: 15 }]}>
                Reset Mock State
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
