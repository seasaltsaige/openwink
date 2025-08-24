import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../helper/Constants";
import { useColorTheme } from "../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { toProperCase } from "../helper/Functions";

interface IComponentModalProps {
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

  const commandTypes = useMemo(() => {
    const commandKeys = Object.keys(DefaultCommandValue).map(key => parseInt(key)).filter(key => !isNaN(key));
    const commandMap: { left: number[], right: number[], both: number[] } = {
      left: [],
      right: [],
      both: [],
    };

    for (const cmd of commandKeys) {
      const englishCommand = DefaultCommandValueEnglish[cmd - 1].toLowerCase();
      commandMap[englishCommand.split(" ")[0] as "left" | "right" | "both"].push(cmd);
    }

    return commandMap;
  }, [DefaultCommandValue]);

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


          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
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
              fontSize: 20,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}>
              Commands
            </Text>

            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 20,
              rowGap: 20,
            }}>
              {
                Object.keys(commandTypes).map((type) => (
                  <View
                    key={type}
                    style={{
                      width: "45%",
                      alignItems: "center",
                      rowGap: 7,
                    }}>
                    {
                      commandTypes[type as "left" | "right" | "both"].map(cmd => (
                        <Pressable
                          style={{
                            width: "100%",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}
                          key={`${type}-${cmd}`}
                          hitSlop={10}
                          onPress={() => {
                            setSelectedCommand(cmd);
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
                                  textDecorationLine: (selectedCommand === cmd) ? "underline" : "none",
                                }}
                              >
                                {DefaultCommandValueEnglish[cmd - 1]}
                              </Text>

                              <IonIcons color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={20} name={(selectedCommand === cmd) ? "radio-button-on" : "radio-button-off"} />
                            </>
                          )}
                        </Pressable>
                      ))
                    }

                  </View>
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
              fontSize: 20,
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