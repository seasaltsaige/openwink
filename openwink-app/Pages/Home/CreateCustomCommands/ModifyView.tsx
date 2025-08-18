
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialCommunityIcons";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { HeaderWithBackButton, TooltipHeader } from "../../../Components";
import { useFocusEffect, useRoute } from "@react-navigation/native";

import { CommandInput, CommandOutput, CustomCommandStore } from "../../../Storage";
import { useCallback, useRef, useState } from "react";
import { ConfirmationModal } from "../../../Components/ConfirmationModal";
import { useThrottle } from "../../../helper/Functions";
import { ComponentModal } from "../../../Components/ComponentModal";

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
  const [command, setCommand] = useState({ name: "", command: [] } as CommandOutput);
  const [undoLog, setUndoLog] = useState([] as Array<CommandOutput>)
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [addComponentVisible, setAddComponentVisible] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  useFocusEffect(useCallback(() => {
    const cmd = CustomCommandStore.get(commandName);
    if (cmd !== null) {
      setCommand(cmd);
      setUndoLog([cmd]);
    } else setUndoLog([{ name: "", command: [] }]);
  }, []));


  const discardChanges = () => {
    if (commandName) CustomCommandStore.deleteCommand(commandName);
    setCommand({} as CommandOutput);
    setUndoLog([]);
    onDiscard();
  }

  const handleCommandChange = (data: {
    name?: string;
    addCommand?: CommandInput;
    removeCommand?: number;
    moveCommand?: { from: number; to: number };
  }) => {
    setUndoLog((old) => [...old, command]);
    if (data.name || data.name === "" || data.addCommand) {
      setCommand((old) => ({
        ...old,
        name: (data.name || data.name === "") ? data.name : old.name,
        command: data.addCommand ? [...old.command!, data.addCommand] : [...old.command!],
      }));
    } else if (data.removeCommand) {
      setCommand((old) => {
        old.command!.splice(data.removeCommand!, 1);
        return { ...old, };
      });
    } else if (data.moveCommand) {
      setCommand((old) => {
        const cmd = old.command!.splice(data.removeCommand!, 1)[0];
        // if moving to position before original position, index is normal
        if (data.moveCommand!.from > data.moveCommand!.to)
          old.command!.splice(data.moveCommand!.to, 0, cmd);
        // otherwise, must subtract one, as item was spliced out of array, changing length
        else
          old.command!.splice(data.moveCommand!.to - 1, 0, cmd);
      })
    } else return false;
  };

  const saveCommand = () => {

  }

  const undo = () => {
    const lastCommandState = undoLog[undoLog.length - 2];
    setUndoLog((old) => {
      old.splice(old.length - 1, 1);
      return [...old];
    });
    setCommand(lastCommandState);
  }

  const canSave = command.name !== "" && command.command && command.command.length > 0;
  const canUndo = undoLog.length > 1;

  return (
    <>
      {/* MAIN Modify VIEW */}
      <View style={theme.container}>

        <HeaderWithBackButton
          backText={back}
          headerText={type === ModifyType.CREATE ? "Create Command" : "Edit Command"}
          headerTextStyle={{ ...theme.settingsHeaderText, fontSize: 28 }}
        />


        <View style={{
          width: "60%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          rowGap: 10,
          marginVertical: 10,
        }}>

          <TooltipHeader
            tooltipContent={
              <Text style={theme.tooltipContainerText}>

              </Text>
            }
            tooltipTitle="Command Name"
          />
          <TextInput
            style={{
              width: "100%",
              fontSize: 18,
              backgroundColor: colorTheme.backgroundSecondaryColor,
              paddingVertical: 7,
              paddingHorizontal: 1,
              borderRadius: 100,
              color: colorTheme.textColor,
              fontFamily: "IBMPlexSans_400Regular",
              textAlign: "center",
            }}
            onEndEditing={() => handleCommandChange({ name: command.name })}
            value={command.name}
            maxLength={16}
            onChangeText={(text) => setCommand((prev) => ({ ...prev, name: text }))}
            placeholder="Enter command name..."
            placeholderTextColor={colorTheme.disabledButtonColor}
          />

        </View>


        <TooltipHeader
          tooltipContent={
            <Text style={theme.tooltipContainerText}>

            </Text>
          }
          tooltipTitle="Command Components"
        />


        <View style={{
          height: "80%",
          width: "100%",
        }}>
          <ScrollView
            contentContainerStyle={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              rowGap: 20,
            }}
            ref={scrollRef}
          >

            {
              command.command ?
                command.command.map((cmd) => (
                  <>
                    {/* TODO: Map commands with edit buttons */}
                  </>
                )) :
                <></>
            }

            <Pressable
              onPress={() => setAddComponentVisible(true)}
              style={({ pressed }) => ({
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 20,
                paddingVertical: 5,
                paddingHorizontal: 15,
                paddingLeft: 20,
                borderStyle: "dashed",
                borderColor: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                borderWidth: 1.75,
                borderRadius: 10,
              })}
              hitSlop={10}
            >
              {
                ({ pressed }) => <>

                  <Text
                    style={{
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      fontSize: 18,
                      fontFamily: "IBMPlexSans_500Medium"
                    }}
                  >
                    Add Component
                  </Text>
                  <IonIcons name="add" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={28} />
                </>
              }
            </Pressable>

          </ScrollView>
        </View>

      </View>
      {/* Modify TOOLBAR FOOTER */}
      <View style={{
        zIndex: 10,
        position: "absolute",
        bottom: 0,
        height: "auto",
        padding: 10,
        backgroundColor: colorTheme.bottomTabsBackground,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        width: "90%",
        alignSelf: "center",
        columnGap: 18,
        boxShadow: "0px -1px 10px rgba(0,0,0,0.2)",
      }}>

        <Pressable
          style={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          hitSlop={20}
          disabled={!canSave}
        // onLongPress={() => }
        >
          {({ pressed }) => (
            <IonIcons name={`save${pressed ? "" : "-outline"}`} color={!canSave ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} style={{ height: 30 }} />
          )}
        </Pressable>

        <Pressable
          style={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          disabled={!canUndo}
          hitSlop={20}
          onPress={undo}
        >
          {({ pressed }) => (
            <MaterialIcons name="undo-variant" size={27} color={!canUndo ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
          )}
        </Pressable>

        <Pressable
          style={{
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          hitSlop={20}
          onPress={() => setConfirmationVisible(true)}
        >
          {({ pressed }) => (
            <IonIcons name={`${commandName ? "trash" : "refresh"}${pressed ? "" : "-outline"}`} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} style={{ height: 30 }} />
          )}
        </Pressable>

      </View>



      <ComponentModal
        onRequestClose={() => setAddComponentVisible(false)}
        visible={addComponentVisible}
        onSelect={({ action, delay }) => { }}
      />

      <ConfirmationModal
        visible={confirmationVisible}
        onRequestClose={() => setConfirmationVisible(false)}
        onConfirm={discardChanges}
        animationType="slide"
        header={"Are you sure?"}
        body={
          commandName ?
            `Are you sure you want to delete ${commandName}? The command will be unrecoverable unless remade.` :
            "Are you sure you want to discard changes made to this command? You will need to restart to create a new command."
        }
        cancelButton="Cancel"
        confirmButton={commandName ? "Delete Command" : "Discard Changes"}
      />
    </>
  )
}