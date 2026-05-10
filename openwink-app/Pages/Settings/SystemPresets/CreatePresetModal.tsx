import { useEffect, useState } from "react";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { SettingsPresetsStore } from "../../../Storage/SettingsPresetsStore";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { ModalBlurBackground } from "../../../Components";
import Toast from "react-native-toast-message";

interface ICreatePresetModalInterface {
  close: () => void;
  visible: boolean;
  startPresetName?: string;
}
export const CreatePresetModal = (props: ICreatePresetModalInterface) => {

  const { colorTheme } = useColorTheme();

  const [presetName, setPresetName] = useState("");
  const presetExists = SettingsPresetsStore.existsByName(presetName);

  const saveProfile = (name: string) => {
    const exists = SettingsPresetsStore.existsByName(name);

    SettingsPresetsStore.saveFromCurrent(name);
    setPresetName("");
    props.close();

    if (exists) // Update toast
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: `The profile '${name}' has been updated successfully.`,
      });
    else // Create toast
      Toast.show({
        type: "success",
        text1: "Profile Created",
        text2: `The profile '${name}' has been created successfully.`,
      });
  }

  useEffect(() => {
    if (props.startPresetName) {
      setPresetName(props.startPresetName);
    }
  }, [props.startPresetName])


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
            backgroundColor: colorTheme.backgroundSecondaryColor,
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
            Profiles are based on your current settings. View them in Settings → Information.
          </Text>

          <TextInput
            style={{
              height: 40,
              backgroundColor: colorTheme.backgroundPrimaryColor,
              width: "75%",
              textAlign: "center",
              borderRadius: 100,
              fontFamily: "IBMPlexSans_400Regular",
              color: colorTheme.textColor,
              marginVertical: 10
            }}
            defaultValue={props.startPresetName || ""}
            editable={props.startPresetName === undefined}
            onChangeText={(text) => setPresetName(text)}
            placeholderTextColor={colorTheme.disabledButtonColor}
            placeholder="Enter preset name..."
            maxLength={15}
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
                  {presetExists ? "Update" : "Create"} Profile
                </Text>
              }
            </Pressable>
            <Pressable
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