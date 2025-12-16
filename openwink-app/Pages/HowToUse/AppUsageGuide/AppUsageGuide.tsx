import { Text, View } from "react-native";
import { useColorTheme } from "../../../hooks/useColorTheme";
import { AutoConnectHeadlightOrientationSVG, InstallFirmwareButtonSVG, FirmwareInstallingSVG, QuickLinksSVG } from "../../../Components/SVG";
import { AccordionDropdown } from "../../../Components";

import { AppUsageModules } from "./Modules";
import { useMemo } from "react";

export function AppUsageGuide() {
  const { colorTheme } = useColorTheme();

  return (
    <View style={{
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      rowGap: 14,
    }}>
      {
        AppUsageModules.map(({ Component, name }) => (
          <Component key={name} />
        ))
      }
    </View>
  )
}



