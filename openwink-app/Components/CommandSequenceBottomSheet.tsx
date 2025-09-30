import { useCallback, RefObject } from "react";
import { Text, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView
} from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import Octicons from "@expo/vector-icons/Octicons";

import { useColorTheme } from "../hooks/useColorTheme";
import { CommandOutput } from "../Storage";
import { DefaultCommandValue, DefaultCommandValueEnglish } from "../helper/Constants";

const COMMAND_TYPE_COLORS: {
  [key in DefaultCommandValue | "delay"]: `#${string}`
} = {
  1: "#4d1d46",
  2: "#563060",
  3: "#8f5050",
  4: "#dc7049",
  5: "#EBB865",
  6: "#35506e",
  7: "#313967",
  8: "#143f46",
  9: "#2a695e",
  10: "#8d8171",
  11: "#cbb89a",
  delay: "#3c3a3d",
}

interface ICommandSequenceBottomSheet {
  bottomSheetRef: RefObject<BottomSheet>;
  command: CommandOutput,
  close: () => void;
}

export function CommandSequenceBottomSheet({
  bottomSheetRef,
  command,
  close
}: ICommandSequenceBottomSheet) {
  const { colorTheme } = useColorTheme();

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  }, []);

  return (

    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      onClose={close}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colorTheme.backgroundSecondaryColor }}
      handleIndicatorStyle={{ backgroundColor: colorTheme.buttonTextColor, width: "15%", marginTop: 5 }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView
        style={{
          padding: 25,
          paddingTop: 10,
          rowGap: 25,
        }}
      >
        <Text style={{
          width: "100%",
          textAlign: "center",
          color: colorTheme.headerTextColor,
          fontSize: 20,
          fontFamily: "IBMPlexSans_700Bold"
        }}>
          Command Sequence for{"\n"}{command?.name}
        </Text>

        <ScrollView
          scrollEnabled
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ columnGap: 7 }}
        >
          {
            (command !== null && command.command! && command.command.length > 0)
              ? (
                command.command.map((cmdPart, index) => (
                  <View
                    key={`${cmdPart.delay}-${cmdPart.transmitValue}-${index}`}
                    style={{ flexDirection: "row", alignItems: "center", columnGap: 7 }}
                  >
                    <View
                      style={{
                        backgroundColor: cmdPart.delay ? COMMAND_TYPE_COLORS["delay"] : COMMAND_TYPE_COLORS[cmdPart.transmitValue!],
                        borderRadius: 100,
                        paddingHorizontal: 18,
                        paddingVertical: 7,
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