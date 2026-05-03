import { useState } from "react";
import { Pressable, Text, TextStyle, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import Tooltip from "react-native-walkthrough-tooltip";

import { useColorTheme } from "../hooks/useColorTheme";
interface ITooltipHeaderProps {
  tooltipContent: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  tooltipTitle: string;
  useModal?: boolean;
  titleStyle?: TextStyle;
  parentControl?: {
    tooltipOpen: boolean;
    setTooltipOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }
}

export function TooltipHeader({
  tooltipContent,
  tooltipTitle,
  useModal = true,
  parentControl,
  titleStyle
}: ITooltipHeaderProps) {
  const { theme, colorTheme } = useColorTheme();
  const [tooltipOpen, setTooltipOpen] = useState(false);


  return (
    <Tooltip
      isVisible={parentControl ? parentControl.tooltipOpen : tooltipOpen}
      onClose={() => parentControl ? parentControl.setTooltipOpen(false) : setTooltipOpen(false)}
      content={tooltipContent}
      placement="bottom"
      contentStyle={theme.tooltipContainer}
      useReactNativeModal={useModal}
    >

      <View style={theme.tooltipContainerView}>
        <Text style={[theme.tooltipText, titleStyle]}>
          {tooltipTitle}
        </Text>

        <Pressable
          hitSlop={20}
          onPress={() => parentControl ? parentControl.setTooltipOpen(true) : setTooltipOpen(true)}
        >
          {
            ({ pressed }) => (
              <IonIcons style={theme.tooltipIcon} color={pressed ? colorTheme.buttonColor : colorTheme.headerTextColor} size={24} name="help-circle-outline" />
            )
          }
        </Pressable>
      </View>


    </Tooltip>
  )
}