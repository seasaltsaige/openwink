
import { FlatList, Modal, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';


import { useColorTheme } from "../../../hooks/useColorTheme";
import {
  HeaderWithBackButton,
  TooltipHeader,
  ConfirmationModal,
  ComponentModal,
  ModalBlurBackground
} from "../../../Components";
import { CustomCommandStore } from "../../../Storage";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../../../helper/Constants";
import { CommandInput, CommandOutput } from "../../../helper/Types";


export enum ModifyType {
  EDIT,
  CREATE,
}

interface IModifyViewProps {
  type: ModifyType;
  commandName: string;
  onDiscard: () => void;
  onSave: () => void;
}

type CommandChangeData =
  | { name: string }
  | { addCommand: CommandInput }
  | { editCommand: { index: number; command: CommandInput } }
  | { removeCommand: number }
  | { moveCommand: { from: number; to: number } };

export function ModifyView({ type, commandName, onDiscard, onSave }: IModifyViewProps) {
  const { colorTheme, theme } = useColorTheme();
  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;
  const [cmdName, setCommandName] = useState("");
  const [command, setCommand] = useState({ name: "", command: [] } as CommandOutput);
  const [undoLog, setUndoLog] = useState([] as Array<CommandOutput>)
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [addComponentVisible, setAddComponentVisible] = useState(false);

  const [addComponentInitialValue, setAddComponentInitialValue] = useState(null as { delay?: number; action?: DefaultCommandValue } | null);
  const [editIndex, setEditIndex] = useState(0);
  // TODO: PREVENT CREATION IF NAME ALREADY EXISTS IN STORAGE

  useFocusEffect(useCallback(() => {
    const cmd = CustomCommandStore.get(commandName);
    if (cmd !== null) {
      setCommand(cmd);
      setCommandName(cmd.name);
      setUndoLog([cmd]);
    } else setUndoLog([]);
  }, []));


  const discardChanges = () => {
    setCommand({} as CommandOutput);
    setUndoLog([]);
    onDiscard();
  }

  const saveCommand = () => {
    if (command.name) {
      if (commandName) CustomCommandStore.editCommand(command.name, command.name, command.command!);
      else CustomCommandStore.saveCommand(command.name, command.command!);
    }

    setUndoLog([]);
    onSave();
  }

  const renderDragItem = useCallback(
    ({ isActive, item, index, onDragEnd, onDragStart, separators }: DragListRenderItemInfo<CommandInput>) => {
      const itemIndex = index;

      return (
        <>
          <View
            key={`${item.transmitValue}-${item.delay}-${itemIndex}`}
            style={{
              display: "flex",
              flexDirection: "row",
              width: 275,
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 2,
              paddingHorizontal: 10,
              borderStyle: "solid",
              borderColor: isActive ? colorTheme.buttonColor : colorTheme.headerTextColor,
              backgroundColor: colorTheme.backgroundPrimaryColor,
              borderWidth: 1.75,
              borderRadius: 10,
              height: 48,
            }}
          >
            {/* Up down re-order button */}
            <View style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 15,
              paddingVertical: 3,
            }}>
              {
                command.command!.length > 1 ?

                  <Pressable
                    onPressIn={onDragStart}
                    onPressOut={onDragEnd}
                    hitSlop={10}
                  >
                    {
                      ({ pressed }) =>
                        <MaterialIcons name="drag-indicator" size={23} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
                    }
                  </Pressable>
                  :
                  <></>
              }

              <Pressable
                hitSlop={10}
                onPress={() => {
                  setEditIndex(itemIndex!);
                  setAddComponentInitialValue({ action: item.transmitValue, delay: item.delay });
                  setAddComponentVisible(true);
                }}
              >
                {({ pressed }) => (
                  <Text style={{
                    color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                    fontSize: 18,
                    fontFamily: "IBMPlexSans_500Medium"
                  }}>
                    {
                      item.delay ? `${item.delay} ms Delay` : DefaultCommandValueEnglish[item.transmitValue! - 1]
                    }
                  </Text>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => handleCommandChange({ removeCommand: itemIndex! })}
            >
              {({ pressed }) => (
                <IonIcons name="close" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} />
              )}
            </Pressable>

          </View>
        </>
      )
    }, [command.command]
  )

  const handleCommandChange = (changeData: CommandChangeData) => {
    setUndoLog((old) => [...old, command]);

    setCommand((oldCommand) => {

      if ("name" in changeData)
        return { ...oldCommand, name: changeData.name };

      if ("addCommand" in changeData)
        return { ...oldCommand, command: [...oldCommand.command!, changeData.addCommand] };

      if ("removeCommand" in changeData && changeData.removeCommand >= 0)
        return { ...oldCommand, command: oldCommand.command!.toSpliced(changeData.removeCommand, 1) };

      if ("moveCommand" in changeData) {
        const cmdArr = [...oldCommand.command!];
        const c = cmdArr.splice(changeData.moveCommand.from, 1)[0];
        cmdArr.splice(changeData.moveCommand.to, 0, c);
        return { ...oldCommand, command: cmdArr };
      }

      if ("editCommand" in changeData) {
        const modified = oldCommand.command!.toSpliced(changeData.editCommand.index, 1);
        modified.splice(changeData.editCommand.index, 0, changeData.editCommand.command);
        return { ...oldCommand, command: modified };
      }

    });
  };

  const undo = () => {
    const lastCommandState = undoLog.at(-1)!;

    setUndoLog((old) => {
      old.splice(old.length - 1, 1);
      return old;
    });
    setCommandName(lastCommandState.name);
    setCommand(() => lastCommandState);
  }

  // Command length needs to be longer than 1 comamnd, otherwise it doesnt make sense to create
  const canSave = command.name !== "" && command.command && command.command.length > 1;
  const canUndo = commandName ? undoLog.length > 1 : undoLog.length > 0;

  const listRef = useRef<FlatList<CommandInput> | null>(null);
  useEffect(() => {
    listRef.current!.scrollToEnd({ animated: false });
    listRef.current!.scrollToOffset({ offset: (48 + 15) * command.command!.length })
  }, [command.command?.length]);

  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);

  const navigation = useNavigation();
  const backWithSaveChanges = () => {
    // If changes have been made in any capacity
    if (canUndo) {
      setUnsavedChangesModalOpen(true);
      // Spawn confirmation modal
      return;
    } else
      navigation.goBack();
  }


  return (
    <SafeAreaView style={theme.container}>
      {/* MAIN Modify VIEW */}

      <HeaderWithBackButton
        backText={back}
        headerText={type === ModifyType.CREATE ? "Create Command" : "Edit Command"}
        headerTextStyle={{ ...theme.settingsHeaderText, fontSize: 28 }}
        pressAction={backWithSaveChanges}
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
              TODO
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
          onEndEditing={() => handleCommandChange({ name: cmdName })}
          value={cmdName}
          maxLength={16}
          onChangeText={(text) => setCommandName(text)}
          placeholder="Enter command name..."
          placeholderTextColor={colorTheme.disabledButtonColor}
        />

      </View>


      <TooltipHeader
        tooltipContent={
          <Text style={theme.tooltipContainerText}>
            TODO
          </Text>
        }
        tooltipTitle="Command Components"
      />


      <View style={{ height: "65%" }}>
        <DragList
          contentContainerStyle={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            rowGap: 12,
          }}
          scrollEnabled
          ref={listRef}
          ListFooterComponent={
            <Pressable
              onPress={() => setAddComponentVisible(true)}
              style={({ pressed }) => ({
                display: "flex",
                width: 275,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 8,
                paddingHorizontal: 8,
                paddingLeft: 20,
                height: 48,
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
          }
          data={command.command!}
          keyExtractor={(item, index) => `${item.delay}-${item.transmitValue}-${index}`}
          renderItem={renderDragItem}
          onReordered={(from, to) => { handleCommandChange({ moveCommand: { from, to } }); }}
        />

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
          onPress={saveCommand}
        >
          {({ pressed }) => (
            <>
              <IonIcons name={`save${pressed ? "" : "-outline"}`} color={!canSave ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} style={{ height: 30 }} />
              <Text style={{
                color: !canSave ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.textColor,
                fontSize: 9,
                marginTop: -4
              }}>
                Save
              </Text>
            </>
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
            <>
              <MaterialCommunityIcons name="undo-variant" size={27} color={!canUndo ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
              <Text style={{
                color: !canUndo ? colorTheme.disabledButtonColor : pressed ? colorTheme.buttonColor : colorTheme.textColor,
                fontSize: 9,
                marginTop: -4
              }}>
                Undo
              </Text>
            </>
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
            <>
              <IonIcons name="refresh" color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={25} style={{ height: 30 }} />
              <Text style={{
                color: pressed ? colorTheme.buttonColor : colorTheme.textColor,
                fontSize: 9,
                marginTop: -4
              }}>
                Discard
              </Text>
            </>
          )}
        </Pressable>
        <ConfirmationModal
          visible={confirmationVisible}
          onRequestClose={() => setConfirmationVisible(false)}
          onConfirm={discardChanges}
          animationType="fade"
          header={"Are you sure?"}
          body={
            `Are you sure you want to discard changes made to ${commandName ? commandName : "this command"}? You will need to restart to create a new command.`
          }
          cancelButton="Cancel"
          confirmButton={"Discard Changes"}
        />

        <ComponentModal
          onRequestClose={() => setAddComponentVisible(false)}
          initialValue={addComponentInitialValue}
          visible={addComponentVisible}
          onSelect={({ action, delay }) => {
            if (addComponentInitialValue !== null)
              handleCommandChange({
                editCommand: {
                  command: { transmitValue: action, delay, },
                  index: editIndex
                }
              })
            else
              handleCommandChange({
                addCommand: {
                  delay: (delay && delay > 0) ? delay : undefined,
                  transmitValue: action,
                }
              });
            setAddComponentInitialValue(null);
            setAddComponentVisible(false);
          }}
        />
      </View>

      <UnsavedChangesModal
        cancel={() => setUnsavedChangesModalOpen(false)}
        discardChanges={() => { setUnsavedChangesModalOpen(false); navigation.goBack(); }}
        saveChanges={() => { }}
        visible={unsavedChangesModalOpen}
      />

    </SafeAreaView>
  )
}



interface IUnsavedChangesModalProps {
  visible: boolean;
  saveChanges: () => void;
  discardChanges: () => void;
  cancel: () => void;
}
const UnsavedChangesModal = ({
  visible,
  cancel,
  discardChanges,
  saveChanges
}: IUnsavedChangesModalProps) => {

  const { theme, colorTheme } = useColorTheme();

  return (
    <Modal
      onRequestClose={cancel}
      transparent
      animationType="fade"
      visible={visible}
    >
      <ModalBlurBackground>
        <View
          style={{
            width: "70%",
            display: "flex",
            flexDirection: "column",
            // alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 20,
            rowGap: 10
          }}
        >
          {/* HEADER TEXT */}
          <Text
            style={{
              color: colorTheme.headerTextColor,
              fontSize: 24,
              fontFamily: "IBMPlexSans_700Bold",
              textAlign: "center"
            }}
          >
            Save Changes?
          </Text>


          <Text
            style={{

              color: colorTheme.headerTextColor,
              fontSize: 16,
              fontFamily: "IBMPlexSans_400Regular",
              textAlign: "center"
            }}
          >
            You have unsaved changes, would you like to save before exiting? Unsaved changes will be lost.
          </Text>

          <View style={{
            alignItems: "center",
            marginTop: 5,
            rowGap: 15,
            marginBottom: 10,
          }}>

            <View style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly"
            }}>


              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
                  // width: "60%",
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  borderRadius: 20,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                })}

                onPress={saveChanges}
              >
                {({ pressed }) =>
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      fontFamily: "IBMPlexSans_500Medium",
                      color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                      // textDecorationLine: "underline"
                    }}
                  >
                    Save
                  </Text>
                }
              </Pressable>

              <Pressable
                onPress={discardChanges}
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
                    Discard
                  </Text>
                }
              </Pressable>

            </View>

            <Pressable
              // style={({ pressed }) => ({
              //   backgroundColor: pressed ? colorTheme.backgroundPrimaryColor : colorTheme.buttonColor,
              //   width: "60%",
              //   paddingVertical: 6,
              //   borderRadius: 20,
              //   boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              // })}
              onPress={cancel}
            // TODO
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
                  {/* {cancelButton} */}
                  {/* TODO */}
                </Text>
              }
            </Pressable>
          </View>
        </View>
      </ModalBlurBackground>
    </Modal>
  )
}