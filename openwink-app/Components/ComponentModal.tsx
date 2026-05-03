import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";

import { buttonBehaviorMap, buttonBehaviorMapReversed, DefaultCommandValue, DefaultCommandValueEnglish } from "../helper/Constants";
import { useColorTheme } from "../hooks/useColorTheme";
import { ModalBlurBackground } from "./ModalBlurBackground";
import { InfoPageHeader } from "./InfoPageHeader";
import { ScrollView } from "react-native-gesture-handler";
import { toProperCase } from "../helper/Functions";
import { TooltipHeader } from "./TooltipHeader";
import { useFocusEffect } from "@react-navigation/native";
interface IComponentModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onSelect: (action: { delay?: number; action?: DefaultCommandValue }) => void;
  initialValue: { delay?: number; action?: DefaultCommandValue } | null;
}

const COMPONENT_CATEGORIES = ["Left", "Right", "Both", "Delay"] as const;

export function ComponentModal({
  onRequestClose,
  onSelect,
  visible,
  initialValue
}: IComponentModalProps) {


  const { theme, colorTheme } = useColorTheme();

  const [selectedCommand, setSelectedCommand] = useState<typeof DefaultCommandValueEnglish[number] | null>(null);
  const [delay, setDelay] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<typeof COMPONENT_CATEGORIES[number]>("Left");

  const categories = useMemo(() => ({
    "Left": DefaultCommandValueEnglish.filter(c => c.startsWith("Left")),
    "Right": DefaultCommandValueEnglish.filter(c => c.startsWith("Right")),
    "Both": DefaultCommandValueEnglish.filter(c => c.startsWith("Both")),
  }), [DefaultCommandValueEnglish]);



  // Set starting value on modal open
  useFocusEffect(useCallback(() => {
    if (initialValue === null) {
      setSelectedCategory("Left");
      setSelectedCommand(null);
      setDelay(0);
      return;
    }

    setSelectedCommand(!initialValue.action ? null : DefaultCommandValueEnglish[initialValue.action - 1]);
    setDelay(!initialValue.delay ? 0 : initialValue.delay);

    if (initialValue.delay)
      setSelectedCategory("Delay");
    else if (DefaultCommandValueEnglish[initialValue.action! - 1].startsWith("Left"))
      setSelectedCategory("Left");
    else if (DefaultCommandValueEnglish[initialValue.action! - 1].startsWith("Right"))
      setSelectedCategory("Right");
    else if (DefaultCommandValueEnglish[initialValue.action! - 1].startsWith("Both"))
      setSelectedCategory("Both");

  }, [initialValue]));

  const __onSelect = useCallback(() => {
    onSelect({
      delay: delay > 0 ? delay : undefined,
      action: selectedCommand !== null ? DefaultCommandValueEnglish.findIndex((v => v === selectedCommand)) + 1 : undefined
    });

    setSelectedCommand(null);
    setDelay(0);
  }, [selectedCommand, delay]);


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

      <ModalBlurBackground>
        <View
          style={{
            width: "88%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 20,
            paddingHorizontal: 20,
            rowGap: 10,
            height: selectedCategory === "Delay" ? "44%" : "48%",
            minHeight: 400,
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

          {/* Sections: "Left", "Right", "Both" */}
          <InfoPageHeader
            categories={COMPONENT_CATEGORIES}
            onSelect={(category) => setSelectedCategory(category)}
            hiddenBorderColor={colorTheme.backgroundSecondaryColor}
            initialValue={selectedCategory}
          />

          <View style={{
            flex: 1,
            marginVertical: 10,
            width: "100%",
            position: "relative",
            paddingHorizontal: selectedCategory === "Delay" ? 0 : 10,
            // paddingTop: 5,
          }}>


            <ScrollView
              contentContainerStyle={{
                rowGap: 12,
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
                paddingHorizontal: 18,
                flex: selectedCategory === "Delay" ? 1 : 0,
              }}
            >
              {
                selectedCategory !== "Delay" ? (
                  categories[selectedCategory].map((action, i) => (
                    <>
                      <Pressable
                        key={`${action}-${i}`}
                        onPress={() => { setSelectedCommand(action); setDelay(0); }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                        hitSlop={15}
                      >
                        {({ pressed }) => (
                          <>
                            <Text
                              style={{
                                fontFamily: "IBMPlexSans_500Medium",
                                fontSize: 18,
                                color: pressed ? colorTheme.buttonColor : colorTheme.textColor,
                              }}
                            >
                              {action}
                            </Text>
                            <IonIcons name={action === selectedCommand ? "radio-button-on-outline" : "radio-button-off-outline"} color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={22} style={{ top: 1 }} />
                          </>
                        )}

                      </Pressable>
                      {
                        i !== (categories[selectedCategory].length - 1) ? (
                          <View key={typeof action === "string" ? `view-${action}` : `view-${action}`} style={{ width: "100%", height: 1.5, borderRadius: 3, backgroundColor: `${colorTheme.disabledButtonColor}70` }} />
                        ) : <></>
                      }
                    </>
                  ))
                ) : (
                  // Delay entry
                  <View
                    style={{
                      alignItems: "center",
                      rowGap: 25,
                      flex: 1,
                      paddingHorizontal: 10,
                    }}
                  >

                    <TooltipHeader
                      tooltipContent={
                        <Text style={theme.tooltipContainerText}>
                          Add a delay, specified in milliseconds, between components of a command sequence to achieve your desired, unique timing and style.
                        </Text>
                      }
                      tooltipTitle="Millisecond Delay"
                      titleStyle={{
                        fontSize: 21
                      }}
                    />

                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        columnGap: 20,
                        width: "100%",
                        backgroundColor: `${colorTheme.disabledButtonColor}33`,
                        borderRadius: 100,
                        paddingHorizontal: 10,
                      }}
                    >
                      <Pressable
                        hitSlop={10}
                        onPress={() => { delay >= 10 ? setDelay((old) => old - 10) : setDelay(0); setSelectedCommand(null); }}
                      >
                        {({ pressed }) => (
                          <IonIcons name="remove" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} />
                        )}
                      </Pressable>

                      <TextInput
                        keyboardType="number-pad"
                        maxLength={5}
                        style={{
                          flex: 1,
                          height: 50,
                          // backgroundColor: colorTheme.backgroundSecondaryColor,
                          color: colorTheme.textColor,
                          textAlign: "center",
                          fontSize: 18,
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
                        onPress={() => { delay <= 99989 ? setDelay((old) => old + 10) : setDelay(99999); setSelectedCommand(null); }}
                      >
                        {({ pressed }) => (
                          <IonIcons name="add" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} />
                        )}
                      </Pressable>

                    </View>
                  </View>
                )
              }
            </ScrollView>

          </View>

          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 8,
            marginBottom: 10,
          }}>
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
                  Select Action
                </Text>
              }
            </Pressable>

            <Pressable
              onPress={() => __onCancel()}
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

        {/* </View> */}
      </ModalBlurBackground>

    </Modal >
  )
}