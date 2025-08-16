import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import IonIcons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useBLE } from "../../../hooks/useBLE";
import { ActivityIndicator } from "react-native";
import { HeaderWithBackButton } from "../../../Components";
import { DefaultCommandValue } from "../../../helper/Constants";
import { CommandOutput } from "../../../Storage";
import { CustomCommand } from "../../../Components/CustomCommand";
import { MainView } from "./MainView";
import { ModifyType, ModifyView } from "./ModifyView";

enum PageType {
  MAIN,
  MODIFY,
}

export function CreateCustomCommand() {

  const [pageState, setPageState] = useState(PageType.MAIN);
  const [modifyType, setModifyType] = useState(ModifyType.CREATE);

  return (
    <>
      {
        pageState === PageType.MAIN ? (
          <MainView
            
          />
        ) : (
          <ModifyView
            type={modifyType}
          />
        )
      }
    </>
  )
}