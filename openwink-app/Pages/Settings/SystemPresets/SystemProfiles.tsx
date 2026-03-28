import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderWithBackButton, LongButton, MainHeader, ModalBlurBackground, SearchBarFilter, TooltipHeader } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { ApplyType, SettingsPreset, SettingsPresetsStore } from "../../../Storage/SettingsPresetsStore";
import IonIcons from "@expo/vector-icons/Ionicons";
import { CreatePresetModal } from "./CreatePresetModal";
import { ApplyConfirmationModal } from "./ApplyConfirmationModal";

export function SystemProfiles() {
  const { theme, colorTheme } = useColorTheme();
  const [presets, setAllPresets] = useState([] as SettingsPreset[]);
  const [filteredPresets, setFilteredPresets] = useState([] as SettingsPreset[]);
  const [profileNameForEdit, setProfileNameForEdit] = useState<string | undefined>(undefined);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const [presetToApply, setPresetToApply] = useState<string | null>(null);
  const applyModalOpen = presetToApply !== null;

  const navigation = useNavigation();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  const fetchProfiles = () => {
    const allPresets = SettingsPresetsStore.getAll();
    setAllPresets(allPresets);
    setFilteredPresets(allPresets);
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
            text="Create New Profile"
            icons={{ names: [null, "color-wand-outline"], size: [20, 20] }}
            pressableStyle={{
              width: "auto",
              columnGap: 15,
              marginVertical: 20,
            }}
            onPress={() => setConfirmationModalOpen(true)}
          />


          <TooltipHeader
            tooltipTitle="System Profiles"
            tooltipContent={
              <Text style={theme.tooltipContainerText}>
                Presets save your settings and device pairing, making it easy to switch between multiple cars or settings setups.
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
              placeholderText="Search for Settings Profiles"
              useFilters={false}
              onFilterTextChange={(filterText) => {

              }}
              onFilteredItemsUpdate={(filteredItems) => {
                setFilteredPresets(filteredItems);
              }}
            />
          </View>

          <View style={{
            flex: 1,
            width: "85%",
          }}>
            <ScrollView
              contentContainerStyle={{
                alignItems: "center",
                justifyContent: "center",
                rowGap: 15,
                marginTop: 10,
                paddingBottom: 20,
              }}
            >
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
                          paddingLeft: 15,
                          paddingRight: 10,
                          height: 45,
                          borderRadius: 7,
                        }}
                        onPress={() => setPresetToApply(preset.name)}
                      >

                        {/* 
                          TODO: Changing settings should remove selected profile status
                            Creating a preset should auto apply it
                          */}
                        {/* Saving/creating a applies it, sure, (it already is), but theres no need to keep track of active ones... pointless imo */}

                        <Text style={{
                          color: colorTheme.textColor,
                          fontFamily: "IBMPlexSans_500Medium",
                          fontSize: 17,
                        }}>
                          {preset.name}
                        </Text>


                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 12 }}>

                          <Pressable hitSlop={10} onPress={() => { setProfileNameForEdit(preset.name); setConfirmationModalOpen(true); }}>
                            {({ pressed }) => (
                              <IonIcons name="create-outline" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={20} />
                            )}
                          </Pressable>

                          <Pressable hitSlop={10} onPress={() => deleteProfile(preset.name)}>
                            {({ pressed }) => (
                              <IonIcons name="close" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={20} />
                            )}
                          </Pressable>
                        </View>

                      </Pressable>

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
        close={() => { setConfirmationModalOpen(false); setProfileNameForEdit(undefined); fetchProfiles(); }}
        visible={confirmationModalOpen}
        startPresetName={profileNameForEdit}
      />

      <ApplyConfirmationModal
        visible={applyModalOpen}
        close={() => setPresetToApply(null)}
        presetName={presetToApply || ""}
      />
    </>
  )
}