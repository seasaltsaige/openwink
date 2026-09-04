import { Pressable, View } from "react-native";
import * as FileSystem from "expo-file-system"
import * as FileSharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

export function ModuleSettingsImportExport({ }) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      columnGap: 20,
    }}>

      <Pressable>
        {
          ({ pressed }) => (
            <></>
          )
        }
      </Pressable>

      <Pressable>
        {
          ({ pressed }) => (
            <></>
          )
        }
      </Pressable>

    </View>
  )
}