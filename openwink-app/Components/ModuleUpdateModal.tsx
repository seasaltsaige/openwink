import { Modal } from "react-native";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import { useColorTheme } from "../hooks/useColorTheme";
import { useBLE } from "../hooks/useBLE";

interface IModuleUpdateModal {
  visible: boolean;
  onRequestClose: () => void;
}

export function ModuleUpdateModal({
  onRequestClose,
  visible,
}: IModuleUpdateModal) {

  const { colorTheme } = useColorTheme();
  const { updateProgress, updatingStatus } = useBLE();

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
            width: "75%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 20,
            rowGap: 12
          }}
        >


        </View>
      </View>
    </Modal>
  )
}