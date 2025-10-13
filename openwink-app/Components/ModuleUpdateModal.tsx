import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { useColorTheme } from "../hooks/useColorTheme";
import { useBleMonitor } from "../Providers/BleMonitorProvider";
import { useOtaUpdate } from "../Providers/OTAUpdateProvider";

interface IModuleUpdateModal {
  version: string;
  description: string;
  visible: boolean;
  stopUpdate: () => Promise<void>
  binSizeBytes: number;
}

export function ModuleUpdateModal({
  version,
  description,
  visible,
  binSizeBytes,
  stopUpdate,
}: IModuleUpdateModal) {

  const { colorTheme } = useColorTheme();
  const { updateProgress, updatingStatus } = useBleMonitor();

  const updateSizeMB = binSizeBytes / 1000 / 1000;
  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
    >

      <View
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${colorTheme.backgroundPrimaryColor}80`,
        }}
      >
        <View
          style={{
            width: "85%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 20,
            rowGap: 17
          }}
        >
          {
            updatingStatus === "Idle" ?
              <View style={{
                flexDirection: "row",
                columnGap: 10,
              }}>
                <Text style={{
                  color: colorTheme.textColor,
                  fontFamily: "IBMPlexSans_500Medium",
                  fontSize: 16,
                }}>
                  Connecting to Module...
                </Text>
                <ActivityIndicator size={"small"} color={colorTheme.buttonColor} />
              </View>
              :
              <Text style={{
                color: colorTheme.textColor,
                fontFamily: "IBMPlexSans_500Medium",
                fontSize: 16,
              }}>
                Updating Firmware... ({updateProgress}%)
              </Text>
          }
          <View style={{
            width: "100%",
            marginHorizontal: 10,
            flexDirection: "row",
            alignItems: "center",
            position: "relative",
          }}>
            <View style={{
              width: "100%",
              backgroundColor: `${colorTheme.disabledButtonColor}80`,
              height: 16,
              position: "absolute",
              borderRadius: 10,
            }} />
            <View style={{
              width: `${updateProgress}%`,
              backgroundColor: colorTheme.buttonColor,
              height: 16,
              position: "absolute",
              borderRadius: 10,
            }} />
          </View>

          <Text style={{
            color: colorTheme.textColor,
            fontFamily: "IBMPlexSans_400Regular",
            fontSize: 14,
            textAlign: "center",
          }}>
            ({((updateSizeMB * updateProgress) / 100).toFixed(2)}MB/{(updateSizeMB).toFixed(2)}MB) – v{version}
          </Text>

          <Text style={{
            marginTop: -10,
            color: colorTheme.textColor,
            fontFamily: "IBMPlexSans_400Regular",
            fontSize: 14,
            textAlign: "center"
          }}>
            {description}
          </Text>

          <Pressable
            onPress={stopUpdate}
          >
            {({ pressed }) =>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 17,
                  fontFamily: "IBMPlexSans_500Medium",
                  color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  textDecorationLine: "underline"
                }}
              >
                Cancel Update
              </Text>
            }
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}