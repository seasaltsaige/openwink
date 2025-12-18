import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";

import { useColorTheme } from "../hooks/useColorTheme";

interface IAccordionDropdownProps {
  headerText: string;
  dropdown: JSX.Element;
}

export function AccordionDropdown({
  headerText,
  dropdown,
}: IAccordionDropdownProps) {

  const [open, setOpen] = useState(false);
  const { colorTheme } = useColorTheme();

  return (
    <View
      style={{
        width: "100%",
        padding: 10,
        paddingHorizontal: 16,
        paddingBottom: open ? 20 : 10,
        borderRadius: 7,
        backgroundColor: colorTheme.backgroundSecondaryColor,
        rowGap: 15,
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={() => setOpen((open) => !open)}
        hitSlop={5}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%"
        }}>

        {
          ({ pressed }) => (
            <>
              <Text
                style={{
                  fontFamily: "IBMPlexSans_500Medium",
                  fontSize: 18,
                  color: pressed ? colorTheme.buttonColor : colorTheme.headerTextColor,
                  width: "90%",
                }}
              >
                {headerText}
              </Text>


              <IonIcons style={{ marginTop: 2, }} name={open ? "chevron-collapse-outline" : "chevron-expand-outline"} color={pressed ? colorTheme.buttonColor : colorTheme.textColor} size={25} />
            </>
          )

        }
      </Pressable>
      {/* </View> */}

      {
        open ? (
          <>
            <View style={{
              width: "100%",
              height: 1.75,
              borderRadius: 10,
              backgroundColor: `${colorTheme.backgroundPrimaryColor}80`,
            }}>
            </View>
            {dropdown}
          </>
        ) :
          <></>
      }
      {/* } */}

    </View >
  )

}