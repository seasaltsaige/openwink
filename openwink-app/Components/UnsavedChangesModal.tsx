import { Modal, Pressable, Text, View } from "react-native";
import { ModalBlurBackground } from "./ModalBlurBackground";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorTheme } from "../hooks/useColorTheme";

interface IUnsavedChangesModalProps {
  visible: boolean;
  // canSaveChanges: boolean;
  saveChanges: () => void;
  discardChanges: () => void;
  cancel: () => void;
}

export function UnsavedChangesModal({
  visible,
  // canSaveChanges,
  cancel,
  discardChanges,
  saveChanges
}: IUnsavedChangesModalProps) {

  const { theme, colorTheme } = useColorTheme();

  return (
    <Modal
      onRequestClose={cancel}
      transparent
      animationType="fade"
      visible={visible}
    >
      <ModalBlurBackground>
        <View
          style={{
            width: "90%",
            display: "flex",
            flexDirection: "column",
            // alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
            rowGap: 15
          }}
        >
          {/* HEADER TEXT */}

          <View
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontSize: 24,
                fontFamily: "IBMPlexSans_700Bold",
                textAlign: "center"
              }}
            >
              Save Changes?
            </Text>

            <Pressable
              style={{
                paddingVertical: 4,
                position: "absolute",
                top: 0,
                right: 0,
              }}
              onPress={cancel}
              hitSlop={10}
            >
              {({ pressed }) =>
                <Ionicons name="close" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={30} />
              }
            </Pressable>
          </View>


          <Text
            style={{

              color: colorTheme.headerTextColor,
              fontSize: 16,
              fontFamily: "IBMPlexSans_400Regular",
              textAlign: "center"
            }}
          >
            You have unsaved changes, would you like to save before exiting? Unsaved changes will be discarded.
          </Text>

          <View style={{
            alignItems: "center",
            marginTop: 15,
            marginBottom: 10,
          }}>

            <View style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly"
            }}>


              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                  width: "40%",
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  borderRadius: 20,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                })}

                onPress={saveChanges}
                hitSlop={10}
              >
                {({ pressed }) =>
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      fontFamily: "IBMPlexSans_500Medium",
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    }}
                  >
                    Save
                  </Text>
                }
              </Pressable>

              <Pressable
                onPress={discardChanges}
                hitSlop={10}
              >
                {({ pressed }) =>
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      fontFamily: "IBMPlexSans_500Medium",
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      textDecorationLine: "underline"
                    }}
                  >
                    Discard
                  </Text>
                }
              </Pressable>

            </View>
          </View>
        </View>
      </ModalBlurBackground>
    </Modal>
  )
}