import { ActivityIndicator, Modal, Text, View } from "react-native";
import { useColorTheme } from "../hooks/useColorTheme";
import { useBLE } from "../hooks/useBLE";

interface IModuleUpdateModal {
  visible: boolean;
  onRequestClose: () => void;
  binSizeBytes: number;
}

export function ModuleUpdateModal({
  onRequestClose,
  visible,
  binSizeBytes,
}: IModuleUpdateModal) {

  const { colorTheme } = useColorTheme();
  const { updateProgress, updatingStatus } = useBLE();

  const updateSizeMB = binSizeBytes / 1000 / 1000;
  return (
    <Modal
      onRequestClose={onRequestClose}
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
            rowGap: 20
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
              backgroundColor: `${colorTheme.disabledButtonColor}69`,
              height: 14,
              position: "absolute",
              borderRadius: 3,
            }} />
            <View style={{
              width: `${updateProgress}%`,
              // width: 200,
              backgroundColor: colorTheme.buttonColor,
              height: 14,
              position: "absolute",
              borderRadius: 3,
            }} />
          </View>

          <Text style={{
            color: colorTheme.textColor,
            fontFamily: "IBMPlexSans_400Regular",
            fontSize: 14,
          }}>
            ({((updateSizeMB * updateProgress) / 100).toFixed(2)}MB/{(updateSizeMB).toFixed(2)}MB)
          </Text>
        </View>
      </View>
    </Modal>
  )
}