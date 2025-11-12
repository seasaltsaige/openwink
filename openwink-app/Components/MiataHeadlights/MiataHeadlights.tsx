import { View } from "react-native";
import Miata from "./Miata";
import { useBleMonitor } from "../../Providers/BleMonitorProvider";
import { useColorTheme } from "../../hooks/useColorTheme";
import { Headlight } from "./Headlight";

export const MiataHeadlights = () => {
  const { themeName, colorTheme } = useColorTheme();
  const { leftStatus, rightStatus } = useBleMonitor();

  const statusToPercent = (headlightStatus: number) => {
    if (headlightStatus === 0) return 0; // Closed
    if (headlightStatus === 1) return 100; // Open
    return headlightStatus * 100; // Partially open
  };

  const panelColor =
    themeName === "brilliantBlack" ?
      colorTheme.backgroundPrimaryColor
    : colorTheme.primary;

  const strokeColor =
    themeName === "brilliantBlack" ? colorTheme.primary : "#000000";

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 0,
        width: "100%",
      }}
    >
      <Miata
        bodyFill={panelColor}
        bodyStroke={strokeColor}
        bodyStrokeWidth={0.2}
        outlineFill={"#000000"}
        runningLightFill="#FE7508"
        runningLightStroke={strokeColor}
        runningLightStrokeWidth={0.3}
      />

      {/* Headlights */}
      <View
        style={{
          position: "absolute",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 44,
          paddingBottom: 49,
          width: 366,
        }}
      >
        <Headlight
          percent={statusToPercent(leftStatus)}
          themeColor={panelColor}
          scale={0.31}
        />
        <Headlight
          percent={statusToPercent(rightStatus)}
          themeColor={panelColor}
          mirrored={true}
          scale={0.31}
        />
      </View>
    </View>
  );
};
