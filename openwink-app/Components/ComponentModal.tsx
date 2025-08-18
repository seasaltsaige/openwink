import { Modal, View } from "react-native";
import { DefaultCommandValue } from "../helper/Constants";
import { useColorTheme } from "../hooks/useColorTheme";

interface IComponentModalProps {
  // animationType?: "slide" | "none" | "fade" | undefined;
  visible: boolean;
  onRequestClose: () => void;
  onSelect: (action: { delay?: number; action?: DefaultCommandValue }) => void;
}

export function ComponentModal({
  onRequestClose,
  onSelect,
  visible
}: IComponentModalProps) {


  const { theme, colorTheme } = useColorTheme();

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
            width: "70%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
            rowGap: 10
          }}
        >

        </View>
      </View>

    </Modal>
  )
}