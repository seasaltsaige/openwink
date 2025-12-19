import { View } from "react-native";
import Miata from "./Miata";
import { useBleMonitor } from "../../Providers/BleMonitorProvider";
import { useColorTheme } from "../../hooks/useColorTheme";
import { Headlight } from "./Headlight";
import { useBleCommand } from "../../Providers/BleCommandProvider";

interface IMiataHeadlightsParams {
  leftStatus: number;
  rightStatus: number;
  width?: number;
  headlightScale?: number;
  headlightPadding?: {
    bottom: number;
    horizontal: number;
  }
}

export const MiataHeadlights = ({
  leftStatus,
  rightStatus,
  headlightPadding,
  headlightScale,
  width = 240
}: IMiataHeadlightsParams) => {
  const { themeName, colorTheme } = useColorTheme();
  const {
    leftRightSwapped
  } = useBleMonitor();

  const statusToPercent = (headlightStatus: number) => {
    if (headlightStatus === 0) return 0; // Closed
    if (headlightStatus === 1) return 100; // Open
    return headlightStatus * 100; // Partially open
  };

  const panelColor =
    themeName === "brilliantBlack" ?
      colorTheme.backgroundSecondaryColor
      : colorTheme.primary;

  const strokeColor =
    themeName === "brilliantBlack" ? colorTheme.primary : "#000000";

  return (
    <View
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // marginVertical: 0,
        // width: "100%",
      }}
    >
      <Miata
        bodyFill={panelColor}
        bodyStroke={strokeColor}
        bodyStrokeWidth={0.2}
        outlineFill={"#000000"}
        runningLightFill="#FE7508"
        runningLightStroke={strokeColor}
        runningLightStrokeWidth={0.4}
        haloColor={colorTheme.disabledButtonColor}
        width={width}
      // height={100}
      />

      {/* Cursed fuckery... to make it work on the info screen... I did not make this SVG system initially so... */}

      {/* Headlights */}
      <View
        style={{
          position: "absolute",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: width === 240 ? "space-evenly" : "center",
          // columnGap: -10,
          paddingHorizontal: headlightPadding?.horizontal || 44,
          paddingBottom: headlightPadding?.bottom || 49,
          // paddingBottom: 200,
          width: 366 / (((width || 240) / 240)),
          // backgroundColor: "pink"
        }}
      >
        <Headlight
          percent={leftRightSwapped ? statusToPercent(leftStatus) : statusToPercent(rightStatus)}
          themeColor={panelColor}
          scale={headlightScale || 0.31}
        />
        {
          width !== 240 ?
            <View style={{ marginHorizontal: -19, marginRight: -17 }} />
            : <></>
        }
        <Headlight
          percent={leftRightSwapped ? statusToPercent(rightStatus) : statusToPercent(leftStatus)}
          themeColor={panelColor}
          mirrored={true}
          scale={headlightScale || 0.31}
        />
      </View>
    </View>
  );
};
