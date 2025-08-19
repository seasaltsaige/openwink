import { Modal, Pressable, Text, View } from "react-native";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../helper/Constants";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useState } from "react";

interface IComponentModalProps {
  // animationType?: "slide" | "none" | "fade" | undefined;
  visible: boolean;
  onRequestClose: () => void;
  onSelect: (action: { delay?: number; action?: DefaultCommandValue }) => void;
}

export function ComponentModal({
  onRequestClose,
  onSelect,
  visible,
}: IComponentModalProps) {


  const { theme, colorTheme } = useColorTheme();

  const [selectedCommand, setSelectedCommand] = useState<DefaultCommandValue | null>(null);
  const [delay, setDelay] = useState<number>(0);

  const __onSelect = () => {
    onSelect({
      delay: delay > 0 ? delay : undefined,
      action: selectedCommand !== null ? selectedCommand : undefined
    });

    setSelectedCommand(null);
    setDelay(0);
  }

  const canSubmit = selectedCommand !== null || delay > 0;

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
            paddingVertical: 10,
            paddingBottom: 15,
            paddingHorizontal: 20,
            rowGap: 12
          }}
        >


          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 22,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center"
            }}
          >
            Add Component
          </Text>


          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 15,
            width: "100%",
          }}>
            <Text style={{
              width: "100%",
              color: colorTheme.headerTextColor,
              fontSize: 18,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}>
              Commands
            </Text>

            <View style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 20,
              rowGap: 10,
            }}>

              {
                Object.keys(DefaultCommandValue).map(key => parseInt(key)).filter(key => !isNaN(key)).map((key) => (
                  <Pressable
                    style={{ width: "45%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                    key={key}
                    hitSlop={10}
                    onPress={() => {
                      setSelectedCommand(key);
                      setDelay(0);
                    }}
                  >
                    {({ pressed }) => (
                      <>
                        <Text
                          style={{
                            fontFamily: "IBMPlexSans_400Regular",
                            fontSize: 16,
                            color: (pressed) ? colorTheme.buttonColor : colorTheme.textColor,
                            textDecorationLine: (selectedCommand === key) ? "underline" : "none",
                          }}
                        >
                          {DefaultCommandValueEnglish[key - 1]}
                        </Text>

                        <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={20} name={selectedCommand === key ? "radio-button-on" : "radio-button-off"} />
                      </>
                    )}

                  </Pressable>
                ))
              }

            </View>
          </View>


          <View>

            <Text>

            </Text>

            <View>

            </View>

          </View>

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: !canSubmit ? colorTheme.disabledButtonColor : pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
              width: "60%",
              paddingVertical: 6,
              borderRadius: 20,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
            })}
            disabled={!canSubmit}
            onPress={__onSelect}
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
                Select
              </Text>
            }
          </Pressable>


          <Pressable
            onPress={onRequestClose}
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
                Cancel
              </Text>
            }
          </Pressable>
        </View>
      </View>

    </Modal>
  )
}