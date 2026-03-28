import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderWithBackButton, LongButton, MainHeader, ModalBlurBackground, SearchBarFilter, TooltipHeader } from "../../Components";
import { useColorTheme } from "../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { SettingsPreset, SettingsPresetsStore } from "../../Storage/SettingsPresetsStore";
import IonIcons from "@expo/vector-icons/Ionicons";

export function SystemProfiles() {
  const { theme, colorTheme } = useColorTheme();
  const [currentPresetName, setCurrentPresetName] = useState("");
  const [presets, setAllPresets] = useState([] as SettingsPreset[]);
  const [filteredPresets, setFilteredPresets] = useState([] as SettingsPreset[]);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const fetchProfiles = () => {
    const allPresets = SettingsPresetsStore.getAll();
    const currentName = SettingsPresetsStore.getCurrentName();
    setAllPresets(allPresets);
    setFilteredPresets(allPresets);
    setCurrentPresetName(currentName);

    console.log(currentName);
  }

  const deleteProfile = (name: string) => {
    SettingsPresetsStore.deletePreset(name);
    fetchProfiles();
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <>
      <SafeAreaView style={theme.container}>
        <HeaderWithBackButton
          backText={back}
          headerText="Profiles"
          headerTextStyle={theme.settingsHeaderText}
        />

        <ScrollView contentContainerStyle={[theme.infoContainer, { flex: 1 }]} style={{ width: "100%" }}>

          <LongButton
            text="Create Profile from Settings"
            icons={{ names: [null, "color-wand-outline"], size: [20, 20] }}
            pressableStyle={{
              width: "78%",
              marginVertical: 20,
            }}
            onPress={() => setConfirmationModalOpen(true)}
          />


          <TooltipHeader
            tooltipTitle="System Profiles"
            tooltipContent={
              <Text style={theme.tooltipContainerText}>
                TODO
              </Text>
            }
          />

          <View style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 5,
            columnGap: 10,
            marginTop: 10,
          }}>
            <SearchBarFilter
              filterables={presets}
              searchFilterKey="name"
              placeholderText="Search for Settings Profile"
              useFilters={false}
              onFilterTextChange={(filterText) => {

              }}
              onFilteredItemsUpdate={(filteredItems) => {
                console.log(filteredItems);
                setFilteredPresets(filteredItems);
              }}
            />
          </View>

          <View style={{
            flex: 1,
            width: "85%",
          }}>
            <ScrollView contentContainerStyle={{ alignItems: "center", justifyContent: "center", rowGap: 15, marginTop: 10 }}>
              {/* Cards */}

              {

                presets.length > 0 ?
                  filteredPresets.map((preset, index) => (
                    <>
                      <Pressable
                        key={`${preset.name}-${preset.createdAt}`}
                        style={{
                          backgroundColor: colorTheme.backgroundSecondaryColor,
                          width: "75%",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingLeft: 10,
                          paddingRight: 10,
                          height: 42,
                          borderRadius: 7,
                        }}
                      >
                        <View style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          columnGap: 10,
                        }}>
                          {
                            preset.name === currentPresetName ? (
                              <IonIcons name="star-outline" color={colorTheme.disabledButtonColor} size={15} />
                            ) : <></>
                          }

                          {/* 
                          TODO: Changing settings should remove selected profile status
                            Creating a preset should auto apply it
                          */}


                          <Text style={{
                            color: colorTheme.buttonTextColor,
                            fontFamily: "IBMPlexSans_500Medium",
                            fontSize: 17,
                          }}>
                            {preset.name}
                          </Text>

                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 12 }}>

                          <Pressable>
                            <IonIcons name="create-outline" color={colorTheme.textColor} size={20} />
                          </Pressable>

                          <Pressable onPress={() => deleteProfile(preset.name)}>
                            <IonIcons name="trash-outline" color={colorTheme.textColor} size={20} />
                          </Pressable>
                        </View>

                      </Pressable >
                      {
                        index === filteredPresets.length - 1 ? <></> : (
                          <View key={`${preset.name}-${preset.createdAt}-divider`} style={{ width: "75%", height: 2, borderRadius: 2, backgroundColor: colorTheme.disabledButtonColor, }} />
                        )
                      }
                    </>
                  ))
                  : <Text>
                    No Profiles Created
                  </Text>
              }
            </ScrollView>
          </View>

        </ScrollView >

      </SafeAreaView >
      <CreatePresetModal
        close={() => { setConfirmationModalOpen(false); fetchProfiles(); }}
        visible={confirmationModalOpen}
        startPresetName={undefined}
      />
    </>
  )
}


interface ICreatePresetModalInterface {
  close: () => void;
  visible: boolean;
  startPresetName?: string;
}
const CreatePresetModal = (props: ICreatePresetModalInterface) => {

  const { colorTheme } = useColorTheme();

  const [presetName, setPresetName] = useState(props.startPresetName || "");

  const presetExists = SettingsPresetsStore.existsByName(presetName);

  const saveProfile = (name: string) => {
    SettingsPresetsStore.saveFromCurrent(name);
    setPresetName("");
    props.close();
  }

  return (
    <Modal
      onRequestClose={props.close}
      transparent
      animationType="fade"
      visible={props.visible}
    >
      <ModalBlurBackground>
        <View
          style={{
            width: "85%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundPrimaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
            rowGap: 10
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
              presetExists ? "Update Profile" : "Create Profile"
            }
          </Text>

          <Text
            style={{

              color: colorTheme.headerTextColor,
              fontSize: 16,
              fontFamily: "IBMPlexSans_400Regular",
              textAlign: "center"
            }}
          >
            Profiles are created based on current module and app settings. To view current settings, navigate to the Information page located in the Settings Menu.
          </Text>

          <TextInput
            style={{
              height: 40,
              backgroundColor: colorTheme.backgroundSecondaryColor,
              width: "75%",
              textAlign: "center",
              borderRadius: 100,
              fontFamily: "IBMPlexSans_400Regular",
              color: colorTheme.textColor,
              marginVertical: 10
            }}
            editable={props.startPresetName === undefined}
            onChangeText={(text) => setPresetName(text)}
            placeholderTextColor={colorTheme.disabledButtonColor}
            placeholder="Enter preset name..."

          />


          <View style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 8,
            marginBottom: 10,
          }}>
            <Pressable
              disabled={presetName.length < 3}
              style={({ pressed }) => ({
                backgroundColor: presetName.length < 3 ? colorTheme.disabledButtonColor : pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                width: "60%",
                paddingVertical: 6,
                borderRadius: 20,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              })}
              onPress={() => saveProfile(presetName)}
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
                  Create Profile
                </Text>
              }
            </Pressable>
            <Pressable
              // onPress={onConfirm}
              // disabled={disableConfirmation}
              onPress={() => { setPresetName(""); props.close(); }}
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
      </ModalBlurBackground>
    </Modal>
  )
}