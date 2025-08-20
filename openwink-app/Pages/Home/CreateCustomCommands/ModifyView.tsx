
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import IonIcons from "@expo/vector-icons/Ionicons";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { HeaderWithBackButton, TooltipHeader } from "../../../Components";
import { useFocusEffect, useRoute } from "@react-navigation/native";

import { CommandInput, CommandOutput, CustomCommandStore } from "../../../Storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmationModal } from "../../../Components/ConfirmationModal";
import { useThrottle } from "../../../helper/Functions";
import { ComponentModal } from "../../../Components/ComponentModal";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../../../helper/Constants";

// import DraggableFlatList, { RenderItem, DraggableFlatListProps, RenderItemParams, RenderPlaceholder, } from "react-native-draggable-flatlist";

import DragList, { DragListRenderItemInfo } from 'react-native-draglist';

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

          {/* {
            itemIndex === command.command!.length - 1 ? (

            ) : <></>
          } */}
        </>
      )
    }, [command.command]
  )

  const handleCommandChange = (data: {
    name?: string;
    addCommand?: CommandInput;
    editCommand?: { index: number; command: CommandInput; };
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
    } else if (data.removeCommand !== undefined && data.removeCommand >= 0) {
      setCommand((old) => {
        const spliced = old.command!.toSpliced(data.removeCommand!, 1);
        return { ...old, command: spliced };
      });
    } else if (data.moveCommand) {
      setCommand((old) => {
        const cmdArr = [...old.command!];
        const c = cmdArr.splice(data.moveCommand!.from!, 1)[0];
        cmdArr.splice(data.moveCommand!.to!, 0, c);
        return { ...old, command: cmdArr };
      });
    } else if (data.editCommand) {
      setCommand((old) => {
        const modified = old.command!.toSpliced(data.editCommand?.index!, 1);
        modified.splice(data.editCommand?.index!, 0, data.editCommand?.command!);
        return { ...old, command: modified };
      })
    }
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

  const canSave = command.name !== "" && command.command && command.command.length > 0;
  const canUndo = commandName ? undoLog.length > 1 : undoLog.length > 0;

  const listRef = useRef<FlatList<CommandInput> | null>(null);
  useEffect(() => {
    listRef.current!.scrollToEnd({ animated: false });
    listRef.current!.scrollToOffset({ offset: (48 + 15) * command.command!.length })
  }, [command.command?.length]);

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


        <View style={{
          height: "65%",
          width: "100%",
        }}>


          <DragList
            contentContainerStyle={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              rowGap: 15,
            }}
            style={{
              height: "100%",
            }}
            containerStyle={{
              height: "100%",
            }}
            scrollEnabled
            ref={listRef}
            getItemLayout={(data, index) => (
              { length: 48, offset: (48 + 15) * index, index }
            )}
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
          animationType="slide"
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
    </>
  )
}