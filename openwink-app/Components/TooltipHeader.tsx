import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import IonIcons from "@expo/vector-icons/Ionicons";
import Tooltip from "react-native-walkthrough-tooltip";

import { useColorTheme } from "../hooks/useColorTheme";
interface ITooltipHeaderProps {
  tooltipContent: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  tooltipTitle: string;
}

export function TooltipHeader({ tooltipContent, tooltipTitle }: ITooltipHeaderProps) {
  const { theme, colorTheme } = useColorTheme();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <Tooltip
      isVisible={tooltipOpen}
      onClose={() => setTooltipOpen(false)}
      content={tooltipContent}
      closeOnBackgroundInteraction
      closeOnContentInteraction
      placement="bottom"
      contentStyle={theme.tooltipContainer}
    >

      <View style={theme.tooltipContainerView}>
        <Text style={theme.tooltipText}>
          {tooltipTitle}
        </Text>

        <Pressable
          hitSlop={20}
          onPress={() => setTooltipOpen(true)}
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