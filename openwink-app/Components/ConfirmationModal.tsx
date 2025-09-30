import { View, Modal, Pressable, Text } from "react-native";

import { useColorTheme } from "../hooks/useColorTheme";

interface IConfirmationModalProps {
  animationType?: "slide" | "none" | "fade" | undefined;
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
  header: string;
  body: string;
  confirmButton: string;
  cancelButton: string;
  disableConfirmation?: boolean;
}

export function ConfirmationModal({
  visible,
  animationType,
  onRequestClose,
  onConfirm,
  header,
  body,
  cancelButton,
  confirmButton,
  disableConfirmation,
}: IConfirmationModalProps) {

  const { theme, colorTheme } = useColorTheme();

  return (
    <Modal
      onRequestClose={onRequestClose}
      transparent
      animationType={animationType}
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
          {/* HEADER TEXT */}
          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center"
            }}
          >
            {header}
          </Text>


          <Text
            style={{

              color: colorTheme.headerTextColor,
              fontSize: 16,
              fontFamily: "IBMPlexSans_400Regular",
              textAlign: "center"
            }}
          >
            {body}
          </Text>

          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 8,
            marginVertical: 15,
            marginBottom: 10,
          }}>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "60%",
                paddingVertical: 6,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
              onPress={() => onRequestClose()}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: colorTheme.headerTextColor,
                  }}
                >
                  {cancelButton}
                </Text>
              }
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={disableConfirmation}
            >
              {({ pressed }) =>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium",
                    color: disableConfirmation ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    textDecorationLine: "underline"
                  }}
                >
                  {confirmButton}
                </Text>
              }
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  )
}