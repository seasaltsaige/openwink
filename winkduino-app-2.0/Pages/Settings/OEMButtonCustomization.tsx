import { Image, Modal, ScrollView, Text, TextInput, View } from "react-native";
import { buttonBehaviorMap, buttonBehaviorMapReversed, ButtonBehaviors, CustomOEMButtonStore } from "../../AsyncStorage/CustomOEMButtonStore";
import { defaults } from "../../hooks/useColorTheme";
import { Device } from "react-native-ble-plx";
import { OpacityButton } from "../../Components/OpacityButton";
import { useEffect, useState } from "react";
import CheckBox from "react-native-bouncy-checkbox";
import React from "react";
interface OEMButtonCustomizationProps {
  visible: boolean;
  close: () => void;
  colorTheme: typeof defaults;
  device: Device | null;
  updateButtonResponse: (presses: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, state: ButtonBehaviors) => Promise<void>;
  updateButtonDelay: (delay: number) => Promise<void>;
}


const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
// press count - 1
// ie: 1 in position 0, 2 in position 1, etc
const countToEnglish = ["Single Press", "Double Press", "Triple Press", "Quadruple Press", "Quintuple Press", "Sextuple Press", "Septuple Press", "Octuple Press", "Nonuple Press", "Decuple Press"];

export function OEMButtonCustomization(props: OEMButtonCustomizationProps) {


  const [delay, setDelay] = useState(500);
  const [setFunctions, setSetFunctions] = useState([
    { behavior: buttonBehaviorMap["Default Behavior"], behaviorEnglish: "Default Behavior" },
  ] as {
    behavior: number, behaviorEnglish: ButtonBehaviors
  }[]);

  const [editBehavior, setEditBehavior] = useState(null as null | { behavior: ButtonBehaviors, presses: number });
  const [createBehavior, setCreateBehavior] = useState(null as null | { behavior: ButtonBehaviors, presses: number });
  const [selectedBehavior, setSelectedBehavior] = useState(null as ButtonBehaviors | null);

  const [delayVal, setDelayVal] = useState("");

  const deleteBehavior = async (i: number) => {
    setSetFunctions((old) => {
      let f = JSON.parse(JSON.stringify(old));
      f.splice(i, 1);
      return f;
    });
    //@ts-ignore
    await props.updateButtonResponse(i, 0);
  }

  const create = async () => {
    if (createBehavior === null) return;
    const i = setFunctions.length;
    setSetFunctions((old) => [...old, { behavior: buttonBehaviorMap[createBehavior.behavior], behaviorEnglish: selectedBehavior! }]);
    //@ts-ignore
    await props.updateButtonResponse(i, selectedBehavior!);

    setCreateBehavior(null);
    setSelectedBehavior(null);
  }

  const saveAction = async () => {
    setSetFunctions((old) => {
      const n = JSON.parse(JSON.stringify(old));
      if (editBehavior === null) return old;
      if (selectedBehavior === null) return old;

      n[editBehavior.presses].behaviorEnglish = selectedBehavior;
      n[editBehavior.presses].behavior = buttonBehaviorMap[selectedBehavior];

      return n;
    });
    //@ts-ignore
    await props.updateButtonResponse(editBehavior?.presses!, selectedBehavior);

    setEditBehavior(null);
    setSelectedBehavior(null);
  }

  const openSelection = (i: number) => {
    if (i >= setFunctions.length) return;

    const val = setFunctions[i];

    setSelectedBehavior(val.behaviorEnglish);
    setEditBehavior({ presses: i, behavior: val.behaviorEnglish });
  }

  const updateDelay = async (delay: string) => {
    const d = parseInt(delay);
    if (isNaN(d)) return setDelayVal("");
    setDelay(d);
    setDelayVal("");
    await props.updateButtonDelay(d);
  }

  useEffect(() => {
    (async () => {
      const all = await CustomOEMButtonStore.getAll();
      if (!all || all.length < 1) return;

      if (all.find(v => v.numberPresses === 0) !== undefined) {
        setSetFunctions(all.map((v) => ({ behavior: v.numberPresses, behaviorEnglish: v.behavior })))
      } else {
        setSetFunctions(old => [
          ...old,
          ...all.map(v =>
          ({
            behavior: v.numberPresses,
            behaviorEnglish: v.behavior
          }))
        ])
      }

    })();
  }, [props.visible]);

  return (
    <Modal
      transparent={false}
      visible={props.visible && props.device !== null}
      animationType="slide"
      hardwareAccelerated
      onRequestClose={() => props.close()}
    >

      <ScrollView
        style={{
          backgroundColor: props.colorTheme.backgroundPrimaryColor,
        }}
        contentContainerStyle={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          position: "relative",
        }}
        nestedScrollEnabled={true}
      >

        {/* Page Name */}
        <Text
          style={{
            width: "90%",
            textAlign: "center",
            color: props.colorTheme.headerTextColor,
            fontSize: 27,
            marginTop: 30,
            fontWeight: "bold",
          }}
        >
          Retractor Button Customization
        </Text>
        {/* Description? */}
        <Text
          style={{
            color: props.colorTheme.textColor,
            width: "90%",
            textAlign: "center",
            fontSize: 16,
          }}
        >
          It is <Text style={{ fontWeight: "bold" }}>HIGHLY</Text> recommended to leave the single button press as the default behavior.
        </Text>

        {/* Set max delay between presses */}
        <View
          style={{
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            marginTop: 25
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              rowGap: 8,
              borderWidth: 2,
              borderColor: props.colorTheme.backgroundSecondaryColor,
              borderRadius: 5,
              padding: 20,
              paddingTop: 15,
            }}
          >
            {/* Include 'disclaimers' about tradeoffs */}
            <Text
              style={{
                textAlign: "center",
                color: props.colorTheme.headerTextColor,
                fontSize: 23,
                fontWeight: "bold"
              }}
            >
              Button Delay Sensitivity
            </Text>


            <Text
              style={{
                color: props.colorTheme.textColor,
                textAlign: "center",
                fontSize: 14,
                display: "flex",
                flexDirection: "row", alignItems: "center",
                justifyContent: "flex-start"
              }}
            >
              This section allows you to customize the sensitivity of the max delay between button presses.

            </Text>
            <OpacityButton
              text="More info →"
              buttonStyle={{
                marginTop: -8,
              }}
              textStyle={{
                color: props.colorTheme.buttonColor,
                fontWeight: "bold",
                fontSize: 17,
                textDecorationColor: props.colorTheme.buttonColor,
                textDecorationLine: "underline",
              }}
              onPress={() => { }}
            />

            <View
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                rowGap: 10,
              }}
            >
              <Text
                style={{
                  color: props.colorTheme.headerTextColor,
                  fontSize: 17,
                  textAlign: "center",

                }}
              >
                Current sensitivity - {delay}ms
              </Text>
              <TextInput
                style={{
                  backgroundColor: props.colorTheme.backgroundSecondaryColor,
                  borderWidth: 1,
                  borderColor: props.colorTheme.buttonTextColor,
                  borderRadius: 5,
                  width: "70%",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  color: props.colorTheme.textColor,
                }}
                placeholder="Enter desired sensitivity in ms"
                keyboardType="number-pad"
                placeholderTextColor={props.colorTheme.textColor}
                onChangeText={(text) => setDelayVal(text)}
                value={delayVal}
              />

              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "100%",
                  borderWidth: 1,
                  columnGap: 40,
                }}
              >
                <OpacityButton
                  text="Save"
                  onPress={() => updateDelay(delayVal)}
                  disabled={delayVal.length < 2}
                  buttonStyle={{
                    borderRadius: 5,
                    padding: 15,
                    paddingVertical: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: delayVal.length < 2 ? props.colorTheme.disabledButtonColor : props.colorTheme.buttonColor,
                    zIndex: 1,
                  }}
                  textStyle={{
                    fontSize: 20,
                    color: delayVal.length < 2 ? props.colorTheme.disabledButtonTextColor : props.colorTheme.buttonTextColor,
                  }}
                />

                <OpacityButton
                  text="Reset"
                  onPress={() => updateDelay("500")}
                  buttonStyle={{
                    borderRadius: 5,
                    padding: 15,
                    paddingVertical: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: props.colorTheme.buttonColor,
                    zIndex: 1,
                  }}
                  textStyle={{
                    fontSize: 20,
                    color: props.colorTheme.buttonTextColor,
                  }}
                />
              </View>
            </View>



          </View>

          {/* Lowering this value means you will have to press the button faster to register multi-button presses.
            Raising this value can cause unwanted delay after finishing the sequence.
           */}

        </View>




        <View
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "scroll",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 10,
            marginVertical: 20,
            marginBottom: 30,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: props.colorTheme.headerTextColor,
              fontSize: 23,
              fontWeight: "bold"
            }}
          >
            Saved Presets
          </Text>

          <OpacityButton
            buttonStyle={{
              padding: 10,
              backgroundColor: setFunctions.length < 10 ? props.colorTheme.buttonColor : props.colorTheme.disabledButtonColor,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            textStyle={{
              color: setFunctions.length < 10 ? props.colorTheme.buttonTextColor : props.colorTheme.disabledButtonTextColor,
              fontSize: 17,
            }}
            text={setFunctions.length < 10 ? `Add ${countToEnglish[setFunctions.length]}` : "None to Add"}
            disabled={setFunctions.length >= 10}
            //@ts-ignore
            onPress={() => { setSelectedBehavior("Left Blink"); setCreateBehavior({ presses: setFunctions.length, behavior: buttonBehaviorMapReversed[setFunctions.length] }); }}
          />



          {
            setFunctions.map((value, i) => (
              <View
                style={{
                  backgroundColor: i % 2 === 0 ? props.colorTheme.backgroundSecondaryColor : "transparent",
                  borderColor: i % 2 === 1 ? props.colorTheme.backgroundSecondaryColor : "transparent",
                  borderWidth: i % 2 === 1 ? 3 : 0,
                  width: "75%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingVertical: 15,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: props.colorTheme.headerTextColor,
                    fontSize: 18,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>Button Presses:</Text> {countToEnglish[i]}
                </Text>
                <Text
                  style={{
                    marginVertical: 5,
                    color: props.colorTheme.headerTextColor,
                    fontSize: 18,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>Action:</Text> {value.behaviorEnglish}
                </Text>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    marginTop: 10,
                    columnGap: 20,
                  }}
                >
                  <OpacityButton
                    buttonStyle={{}}
                    text="Update Behavior"
                    textStyle={{
                      color: props.colorTheme.buttonColor,
                      textDecorationColor: props.colorTheme.buttonColor,
                      textDecorationStyle: "solid",
                      textDecorationLine: "underline",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                    onPress={() => openSelection(i)}
                  />


                  {
                    i === 0 ?
                      <></>
                      :
                      <OpacityButton
                        buttonStyle={{}}
                        text="Delete"
                        textStyle={{
                          color: props.colorTheme.buttonColor,
                          textDecorationColor: props.colorTheme.buttonColor,
                          textDecorationStyle: "solid",
                          textDecorationLine: "underline",
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                        onPress={() => {
                          // Delete Action
                          // CAN NOT DELETE SINGLE PRESS
                          if (i === 0) return;
                          deleteBehavior(i);
                        }}
                      />
                  }
                </View>
              </View>
            ))
          }
        </View>



        <OpacityButton
          buttonStyle={{
            borderRadius: 5,
            padding: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: props.colorTheme.buttonColor,
            marginBottom: 25,
            zIndex: 1,
          }}
          textStyle={{
            fontSize: 20,
            color: props.colorTheme.buttonTextColor,
          }}
          text="Close"
          onPress={() => props.close()}

        />

      </ScrollView>

      {/* <Modal></Modal> */}

      <Modal
        visible={editBehavior !== null}
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setEditBehavior(null)}
        transparent
      >
        <View
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: props.colorTheme.backgroundPrimaryColor,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: 20,
              rowGap: 20,
              width: "80%",
              borderRadius: 10,
            }}
          >


            <Text
              style={{
                color: props.colorTheme.headerTextColor,
                fontSize: 24,
                marginBottom: 20,
              }}
            >
              Editing <Text style={{ fontWeight: "bold" }}>{countToEnglish[editBehavior?.presses!]}</Text>
            </Text>

            {
              Object.keys(buttonBehaviorMap).map((key, i) => {
                {
                  return (editBehavior?.presses! > 0 && i === 0) ?
                    <></> :
                    <CheckBox
                      key={i}
                      isChecked={selectedBehavior === key}
                      text={key}
                      style={{ width: "70%" }}
                      iconStyle={{ borderColor: "green" }}
                      innerIconStyle={{ borderWidth: -4 }}
                      textStyle={{ textDecorationLine: "none", textAlign: "center", color: props.colorTheme.textColor }}
                      unFillColor={props.colorTheme.buttonTextColor}
                      fillColor={props.colorTheme.buttonColor}
                      onPress={() => { setSelectedBehavior(key as ButtonBehaviors); }}
                    />
                }
              })
            }

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                width: "75%",
                marginTop: 20,
                // columnGap: 5,
              }}
            >
              <OpacityButton
                buttonStyle={{
                  borderRadius: 5,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#228B22",
                  zIndex: 1,
                }}
                textStyle={{
                  fontSize: 20,
                  color: props.colorTheme.buttonTextColor,
                }}
                text="Save"
                onPress={() => { saveAction(); }}

              />


              <OpacityButton
                buttonStyle={{
                  borderRadius: 5,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: props.colorTheme.buttonColor,
                  zIndex: 1,
                }}
                textStyle={{
                  fontSize: 20,
                  color: props.colorTheme.buttonTextColor,
                }}
                text="Cancel"
                onPress={() => setEditBehavior(null)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={createBehavior !== null}
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setCreateBehavior(null)}
        transparent
      >
        <View
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: props.colorTheme.backgroundPrimaryColor,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: 20,
              rowGap: 20,
              width: "80%",
              borderRadius: 10,
            }}
          >


            <Text
              style={{
                color: props.colorTheme.headerTextColor,
                fontSize: 24,
                marginBottom: 20,
              }}
            >
              Creating <Text style={{ fontWeight: "bold" }}>{countToEnglish[createBehavior?.presses!]}</Text>
            </Text>

            {
              Object.keys(buttonBehaviorMap).map((key, i) => {
                {
                  return (i === 0) ?
                    <></> :
                    <CheckBox
                      isChecked={selectedBehavior === key}
                      text={key}
                      style={{ width: "70%" }}
                      iconStyle={{ borderColor: "green" }}
                      innerIconStyle={{ borderWidth: -4 }}
                      textStyle={{ textDecorationLine: "none", textAlign: "center", color: props.colorTheme.textColor }}
                      unFillColor={props.colorTheme.buttonTextColor}
                      fillColor={props.colorTheme.buttonColor}
                      onPress={() => { setSelectedBehavior(key as ButtonBehaviors); }}
                    />
                }
              })
            }

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                width: "75%",
                marginTop: 20,
                // columnGap: 5,
              }}
            >
              <OpacityButton
                buttonStyle={{
                  borderRadius: 5,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#228B22",
                  zIndex: 1,
                }}
                textStyle={{
                  fontSize: 20,
                  color: props.colorTheme.buttonTextColor,
                }}
                text="Save"
                onPress={() => { create(); }}

              />


              <OpacityButton
                buttonStyle={{
                  borderRadius: 5,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: props.colorTheme.buttonColor,
                  zIndex: 1,
                }}
                textStyle={{
                  fontSize: 20,
                  color: props.colorTheme.buttonTextColor,
                }}
                text="Cancel"
                onPress={() => setCreateBehavior(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  )
}