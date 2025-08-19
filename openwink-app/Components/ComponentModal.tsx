import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../helper/Constants";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";

interface IComponentModalProps {
  // animationType?: "slide" | "none" | "fade" | undefined;
  visible: boolean;
  onRequestClose: () => void;
  onSelect: (action: { delay?: number; action?: DefaultCommandValue }) => void;
  initialValue: { delay?: number; action?: DefaultCommandValue } | null;
}

export function ComponentModal({
  onRequestClose,
  onSelect,
  visible,
  initialValue
}: IComponentModalProps) {


  const { theme, colorTheme } = useColorTheme();

  const [selectedCommand, setSelectedCommand] = useState<DefaultCommandValue | null>(null);
  const [delay, setDelay] = useState<number>(0);

  useEffect(() => {
    console.log(initialValue);
    setSelectedCommand(!initialValue?.action ? null : initialValue.action);
    setDelay(!initialValue?.delay ? 0 : initialValue.delay);
  }, [initialValue]);

  const __onSelect = () => {
    onSelect({
      delay: delay > 0 ? delay : undefined,
      action: selectedCommand !== null ? selectedCommand : undefined
    });

    setSelectedCommand(null);
    setDelay(0);
  }

  const __onCancel = () => {
    setSelectedCommand(null);
    setDelay(0);

    onRequestClose();
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
            {
              initialValue !== null ?
                "Edit Component" :
                "Add Component"
            }
          </Text>


          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 15,
            marginVertical: 10,
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
                            fontFamily: "IBMPlexSans_500Medium",
                            fontSize: 16,
                            color: (pressed) ? colorTheme.buttonColor : colorTheme.textColor,
                            textDecorationLine: (selectedCommand === key) ? "underline" : "none",
                          }}
                        >
                          {DefaultCommandValueEnglish[key - 1]}
                        </Text>

                        <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={20} name={(selectedCommand === key) ? "radio-button-on" : "radio-button-off"} />
                      </>
                    )}

                  </Pressable>
                ))
              }

            </View>
          </View>


          <View
            style={{
              alignItems: "center",
              justifyContent: "flex-start",
              rowGap: 15,
              marginBottom: 10,
            }}
          >
            <Text style={{
              width: "100%",
              color: colorTheme.headerTextColor,
              fontSize: 18,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}>
              Millisecond Delay
            </Text>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 20,
                // backgroundColor: "orange",
              }}
            >
              <Pressable
                hitSlop={10}
                onPress={() => delay >= 10 ? setDelay((old) => old - 10) : setDelay(0)}
              >
                {({ pressed }) => (
                  <IonIcons name="remove" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={22} />
                )}
              </Pressable>

              <TextInput
                keyboardType="number-pad"
                maxLength={5}
                style={{
                  width: 100,
                  height: 40,
                  backgroundColor: colorTheme.backgroundSecondaryColor,
                  color: colorTheme.textColor,
                  textAlign: "center",
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_500Medium"
                }}
                value={delay === 0 ? "" : delay.toString()}
                textContentType="none"
                onChangeText={(text) => {
                  if (isNaN(parseInt(text)) && text !== "") return;
                  setDelay(parseInt(text === "" ? "0" : text));
                  setSelectedCommand(null);
                }}
                placeholder="Enter Delay"
                placeholderTextColor={colorTheme.disabledButtonColor}
              />

              <Pressable
                hitSlop={10}
                onPress={() => delay <= 99989 ? setDelay((old) => old + 10) : setDelay(99999)}
              >
                {({ pressed }) => (
                  <IonIcons name="add" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={22} />
                )}
              </Pressable>

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
            onPress={__onCancel}
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
                Cancel
              </Text>
            }
          </Pressable>
        </View>
      </View>

    </Modal>
  )
}