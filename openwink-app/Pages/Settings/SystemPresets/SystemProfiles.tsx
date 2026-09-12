import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationModal, HeaderWithBackButton, ExportModal, SearchBarFilter, TooltipHeader, ExportSettingOptions } from "../../../Components";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Fragment, useCallback, useEffect, useState } from "react";
import { SettingsPreset, SettingsPresetsStore } from "../../../Storage/SettingsPresetsStore";
import IonIcons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { CreatePresetModal } from "./CreatePresetModal";
import { ApplyConfirmationModal } from "./ApplyConfirmationModal";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import RNHapticFeedback from "react-native-haptic-feedback";
import Toast from "react-native-toast-message";

export function SystemProfiles() {
  const { theme, colorTheme } = useColorTheme();
  const [presets, setAllPresets] = useState([] as SettingsPreset[]);
  const [filteredPresets, setFilteredPresets] = useState([] as SettingsPreset[]);
  const [profileNameForEdit, setProfileNameForEdit] = useState<string | undefined>(undefined);
  const [profileNameForExport, setProfileNameForExport] = useState("");

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);

  const [importProfileData, setImportProfileData] = useState(null as null | Partial<Record<(keyof ExportSettingOptions) | "profileName", any>>);
  const [importConfirmModalOpen, setImportConfirmModalOpen] = useState(false);

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


  const applyProfileFromImport = useCallback(async (passedData?: Partial<Record<(keyof ExportSettingOptions) | "profileName", any>>) => {
    const jsonData = importProfileData || passedData;

    if (!jsonData) return;

    const presetObject: Partial<SettingsPreset> = {};
    presetObject.name = jsonData.profileName;

    // Easy case
    if (jsonData.appTheme)
      presetObject.colorTheme = jsonData.appTheme;

    if (jsonData.autoConnection)
      presetObject.autoConnect = jsonData.autoConnection;

    if (jsonData.orientation)
      presetObject.headlightOrientation = jsonData.orientation;




    if (jsonData.sleepyEyeConfig) {
      presetObject.sleepyEye = {
        left: jsonData.sleepyEyeConfig.left,
        right: jsonData.sleepyEyeConfig.right,
      }
    }



    if (jsonData.waveDelayConfig)
      presetObject.customWaveMultiplier = jsonData.waveDelayConfig;


    if (jsonData.auxButtonConfig)
      presetObject.auxBtnConfig = {
        enabled: jsonData.auxButtonConfig.enabled,
        one: {
          type: jsonData.auxButtonConfig.auxOne.switchType,
          action: jsonData.auxButtonConfig.auxOne.pressAction,
          loop: jsonData.auxButtonConfig.auxOne.actionLoop,
        },
        two: {
          type: jsonData.auxButtonConfig.auxTwo.switchType,
          action: jsonData.auxButtonConfig.auxTwo.pressAction,
          loop: jsonData.auxButtonConfig.auxTwo.actionLoop,
        }
      }


    if (jsonData.customCommands)
      presetObject.customCommands = jsonData.customCommands;

    if (jsonData.pairing) {
      presetObject.deviceUUID = jsonData.pairing.pairingKey;
      presetObject.deviceMAC = jsonData.pairing.mac;
      presetObject.firmwareVersion = jsonData.pairing.firmwareVersion;
    }

    if (jsonData.oemButtonConfig) {
      presetObject.customOEMButtonEnabled = jsonData.oemButtonConfig.enabled;
      presetObject.customOEMBypassEnabled = jsonData.oemButtonConfig.headlightBypassEnabled;
      presetObject.customOEMButtonDelay = jsonData.oemButtonConfig.pressInterval;
      presetObject.customOEMButtons = jsonData.oemButtonConfig.pressActions;
    }

    if (jsonData.quickLinkSettings)
      presetObject.quickLinks = jsonData.quickLinkSettings;

    SettingsPresetsStore.createFromData(presetObject);

    fetchProfiles();

    setImportConfirmModalOpen(false);
    setImportProfileData(null);

    Toast.show({
      type: "success",
      text1: `Import Success`,
      text2: `Profile '${presetObject.name}' successfully imported.`,
    });
  }, [importProfileData]);

  const importSettings = async () => {
    const pickerResult = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false });
    if (pickerResult.canceled)
      return Toast.show({
        type: "info",
        text1: "Import Cancelled",
        text2: "Profile import was cancelled, no action taken."
      });

    const fileData = await FileSystem.readAsStringAsync(pickerResult.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });

    const jsonData: Partial<Record<(keyof ExportSettingOptions) | "profileName", any>> = JSON.parse(fileData);

    if (!jsonData.profileName) {
      return Toast.show({
        type: "error",
        text1: "Incorrect File Format",
        text2: "The provided file does not contain the correct information to import a settings profile.",
      });
    }


    // Profile of name already exists, prompt user to confirm
    // importing will overwrite settings of existing preset
    if (SettingsPresetsStore.existsByName(jsonData.profileName)) {
      setImportProfileData(jsonData);
      setImportConfirmModalOpen(true);
    } else applyProfileFromImport(jsonData);

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

        <TooltipHeader
          tooltipTitle="System Profiles"
          tooltipContent={
            <Text style={theme.tooltipContainerText}>
              Presets save your settings and device pairing, making it easy to switch between multiple cars or settings setups.
            </Text>
          }
        />

        <View style={{
          width: "85%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 5,
          columnGap: 10
        }}>

          <Pressable
            hitSlop={10}
            onPress={() => setConfirmationModalOpen(true)}
          >
            {
              ({ pressed }) =>
                <IonIcons name="add" size={27} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
            }
          </Pressable>

          <SearchBarFilter
            filterables={presets}
            searchFilterKey="name"
            placeholderText="Search for profiles..."
            useFilters={false}
            onFilterTextChange={(filterText) => { }}
            onFilteredItemsUpdate={(filteredItems) => {
              setFilteredPresets(filteredItems);
            }}
          />

          <Pressable
            hitSlop={10}
            style={{
              alignItems: "center",
              justifyContent: "center",
              columnGap: 13,
            }}
            onPress={() => importSettings()}
          >
            {
              ({ pressed }) => (
                <>
                  <AntDesign name="download" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={19} />
                  <Text style={{
                    color: pressed ? colorTheme.buttonColor : colorTheme.textColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 8,
                  }}>
                    Import
                  </Text>
                </>
              )
            }
          </Pressable>
        </View>


        <ScrollView
          contentContainerStyle={[
            theme.infoContainer, {
              flex: 1,
            }]} style={{ width: "100%" }}>


          <View style={{
            flex: 1,
            width: "90%",
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

                (presets.length > 0) ?
                  filteredPresets.map((preset, index) => (
                    <Fragment
                      key={`${preset.name}-${preset.createdAt}`}
                    >
                      {/* {preset.createdAt} */}
                      <Pressable
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                          width: "100%",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingLeft: 15,
                          paddingRight: 10,
                          height: 45,
                          borderRadius: 7,
                        })}
                        // onPress={() => { setConfigModalOpen(true); setProfileNameForEdit(preset.name); }}
                        onPress={() => setPresetToApply(preset.name)}
                        // 
                        onLongPress={() => { setProfileNameForEdit(preset.name); setConfirmationModalOpen(true); RNHapticFeedback.trigger("longPress", { ignoreAndroidSystemSettings: false }); }}
                      >

                        <View style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          columnGap: 8
                        }}>
                          <Text style={{
                            color: colorTheme.textColor,
                            fontFamily: "IBMPlexSans_500Medium",
                            fontSize: 16,
                          }}>
                            {preset.name}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 12 }}>

                          <Text
                            style={{
                              color: `${colorTheme.disabledButtonColor}70`,
                              fontSize: 12,
                              fontFamily: "IBMPlexSans_500Medium"
                            }}
                          >
                            Modified {new Date(preset.updatedAt).toLocaleDateString()}
                          </Text>

                          <Pressable hitSlop={15} onPress={() => { setProfileNameForExport(preset.name); setExportOptionsOpen(true); }}>
                            {({ pressed }) => (
                              <IonIcons name="share-social-outline" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={19} />
                            )}
                          </Pressable>

                          <Pressable hitSlop={10} onPress={() => { setProfileNameForEdit(preset.name); setDeleteConfirmationOpen(true) }}>
                            {({ pressed }) => (
                              <IonIcons name="close" color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={22} />
                            )}
                          </Pressable>
                        </View>

                      </Pressable>

                    </Fragment>
                  ))
                  : <Text style={{
                    color: colorTheme.headerTextColor,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 18,
                    textAlign: "center",
                  }}>
                    No Profiles Created {"\n"}
                    <Text style={{
                      fontSize: 15,
                      fontFamily: "IBMPlexSans_400Regular"
                    }}>
                      Create one above
                    </Text>
                  </Text>
              }
            </ScrollView>
          </View>

        </ScrollView >

      </SafeAreaView>

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


      <ConfirmationModal
        visible={importConfirmModalOpen}
        header="Are you sure?"
        body={`The profile '${importProfileData?.profileName}' already exists, importing this profile will overwrite the old profile. Continue?`}
        cancelButton="Cancel"
        confirmButton="Confirm"
        onRequestClose={() => { setImportProfileData(null); setImportConfirmModalOpen(false); }}
        onConfirm={() => applyProfileFromImport()}
      />


      <ConfirmationModal
        body={`Are you sure you want to delete profile '${profileNameForEdit}'? This can not be undone.`}
        header="Are you sure?"
        animationType="fade"
        cancelButton="Cancel"
        confirmButton="Delete"
        visible={deleteConfirmationOpen}
        onRequestClose={() => { setDeleteConfirmationOpen(false); setProfileNameForEdit(undefined); }}
        onConfirm={() => { deleteProfile(profileNameForEdit!); setDeleteConfirmationOpen(false); setProfileNameForEdit(undefined); }}
      />

      <ExportModal
        visible={exportOptionsOpen}
        profile={profileNameForExport}
        close={() => setExportOptionsOpen(false)}
      />
    </>
  )
}