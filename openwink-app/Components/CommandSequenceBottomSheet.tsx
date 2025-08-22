import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Text, View } from "react-native";
import { Pressable, ScrollView } from "react-native-gesture-handler";
import { useColorTheme } from "../hooks/useColorTheme";
import React from "react";

import IonIcons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { CommandOutput } from "../Storage";
import { DefaultCommandValueEnglish } from "../helper/Constants";

interface ICommandSequenceBottomSheet {
  bottomSheetRef: React.RefObject<BottomSheet>;
  command: CommandOutput,
  close: () => void;
}

export function CommandSequenceBottomSheet({
  bottomSheetRef,
  command,
  close
}: ICommandSequenceBottomSheet) {
  const { colorTheme } = useColorTheme();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      onClose={close}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: colorTheme.backgroundSecondaryColor,
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)"
      }}
      handleIndicatorStyle={{ backgroundColor: colorTheme.buttonTextColor, width: "15%", marginTop: 5 }}
      enableDynamicSizing
    >
      <BottomSheetView
        style={{
          padding: 25,
          paddingTop: 10,
          rowGap: 30,
        }}
      >
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Text style={{
            width: "75%",
            textAlign: "left",
            color: colorTheme.headerTextColor,
            fontSize: 19,
            fontFamily: "IBMPlexSans_700Bold"
          }}>
            Command Sequence for{"\n"}{command?.name}
          </Text>


          <Pressable
            hitSlop={10}
            key={"close-button"}
            onPress={() => bottomSheetRef.current?.close()}
          >
            {
              ({ pressed }) =>
                <IonIcons name="close" size={30} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} />
            }
          </Pressable>

        </View>



        <ScrollView
          scrollEnabled
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            columnGap: 5,
          }}

        >
          {
            (command !== null && command.command! && command.command.length > 0)
              ? (
                command.command.map((cmdPart, index) => (
                  <View
                    key={`${cmdPart.delay}-${cmdPart.transmitValue}-${index}`}
                    style={{ flexDirection: "row", alignItems: "center", columnGap: 5 }}
                  >
                    <View
                      style={{
                        backgroundColor: `${colorTheme.backgroundPrimaryColor}CC`,
                        borderRadius: 100,
                        paddingHorizontal: 15,
                        paddingVertical: 5,
                      }}
                    >
                      <Text style={{
                        color: colorTheme.textColor,
                        fontSize: 17,
                        fontFamily: "IBMPlexSans_500Medium"
                      }}>
                        {
                          cmdPart.delay ? `${cmdPart.delay} ms Delay` : DefaultCommandValueEnglish[cmdPart.transmitValue! - 1]
                        }
                      </Text>
                    </View>
                    {
                      index !== command.command!.length - 1 ? (
                        <Octicons
                          name="chevron-right"
                          size={12}
                          color={colorTheme.disabledButtonColor} />
                      ) : <></>
                    }
                  </View>
                ))
              ) :
              <Text>No Command Sequence Found</Text>
          }
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  )
}