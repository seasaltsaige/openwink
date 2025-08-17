
import { Pressable, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialCommunityIcons";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { HeaderWithBackButton } from "../../../Components";
import { useRoute } from "@react-navigation/native";

import { CustomCommandStore } from "../../../Storage";

export enum ModifyType {
  EDIT,
  CREATE,
}

interface IModifyViewProps {
  type: ModifyType;
  commandName: string;
  onDiscard: () => void;
}

export function ModifyView({ type, commandName, onDiscard }: IModifyViewProps) {
  const { colorTheme, theme } = useColorTheme();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;


  const discardChanges = () => {
    // TODO: Reset all parameters

    onDiscard();
  }

  return (
    <>
      {/* MAIN Modify VIEW */}
      <View style={theme.container}>

        <HeaderWithBackButton
          backText={back}
          headerText={type === ModifyType.CREATE ? "Create Custom" : "Edit Custom"}
          headerTextStyle={theme.settingsHeaderText}
        />

      </View>
      {/* Modify TOOLBAR FOOTER */}
      <View style={{
        zIndex: 10,
        position: "absolute",
        bottom: 0,
        height: "auto",
        padding: 10,
        backgroundColor: colorTheme.backgroundSecondaryColor,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        width: "90%",
        alignSelf: "center",
        columnGap: 18,
        // elevation: 10,
        boxShadow: "0px -1px 10px rgba(0,0,0,0.2)",
      }}>

        <Pressable
          style={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colorTheme.backgroundSecondaryColor
          }}
          hitSlop={20}
        // onLongPress={() => }
        >
          {({ pressed }) => (
            <IonIcons name={`save${pressed ? "" : "-outline"}`} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={30} style={{ height: 30 }} />
          )}
        </Pressable>

        <Pressable
          style={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colorTheme.backgroundSecondaryColor
          }}
          hitSlop={20}
        >
          {({ pressed }) => (
            // <IonIcons name={`arrow-undo${pressed ? "" : "-outline"}`} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={30} style={{ height: 30 }} />
            <MaterialIcons name="undo-variant" size={30} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
          )}
        </Pressable>

        <Pressable
          style={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colorTheme.backgroundSecondaryColor
          }}
          hitSlop={20}
          onPress={discardChanges}
        >
          {({ pressed }) => (
            <IonIcons name={`trash${pressed ? "" : "-outline"}`} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={30} style={{ height: 30 }} />
          )}
        </Pressable>

      </View>
    </>
  )
}