import { Text, View } from "react-native";
import { AccordionDropdown, MiataHeadlights } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";
import { useBleMonitor } from "../../../../Providers/BleMonitorProvider";
import { SleepyQuickAdjustSVG, SleepyEyeSVG } from "../../../../Components/SVG";

export function SleepyEye() {
  const { colorTheme } = useColorTheme();
  const { leftSleepyEye, rightSleepyEye } = useBleMonitor();

  return (
    <AccordionDropdown
      key={"sleepy"}
      headerText="Sleepy Eye Level"
      dropdown={
        <>
          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Sleepy Eye Level affects the position which the headlights stop at when the action is activated. This position is approximate, as the distance the headlights travel changes slightly depending on whether the car is running or not.
          </Text>

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            Navigate to "Settings" → "Module Settings" → "Sleepy Eye Settings"{"\n"}
            From here, there are multiple ways to adjust the sleepy level.
          </Text>

          <View
            style={{
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-start",
              rowGap: 5,
            }}
          >
            <Text
              style={{
                color: `${colorTheme.headerTextColor}99`,
                fontFamily: "IBMPlexSans_400Regular",
                width: "90%",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {"    "}• The primary being the ability to drag the headlights up and down to their desired position. This can be hard to get a precise position.
            </Text>


            <Text
              style={{
                color: `${colorTheme.headerTextColor}99`,
                fontFamily: "IBMPlexSans_400Regular",
                width: "90%",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {"    "}• Additionally, if you are in need of more fine control, pressing on the up/down arrows will step one step at a time.
            </Text>


            <Text
              style={{
                color: `${colorTheme.headerTextColor}99`,
                fontFamily: "IBMPlexSans_400Regular",
                width: "90%",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {"    "}• Finally, Course Adjust increase the size of a 'step' from 1% → 15%, allowing for faster adjustments.
            </Text>

          </View>

          <View
            style={{
              position: "relative",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <SleepyEyeSVG />
            <View
              style={{
                position: "absolute",
                zIndex: 10,
                top: 40,
                // backgroundColor: "pink",
              }}
            >
              <MiataHeadlights
                width={180}
                headlightScale={0.23}
                headlightPadding={{
                  bottom: 37,
                  horizontal: 86,
                }}
                rightStatus={50 / 100}
                leftStatus={61 / 100}
              />
            </View>
          </View>


          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "center",
              fontSize: 15,
            }}
          >
            Lastly, if manual adjustment takes too long, you are able to select from quick presets for both left and right sides.{"\n"}
            High ≈ raised 75%{"\n"}
            Middle ≈ raised 50%{"\n"}
            Low ≈ raised 25%
          </Text>

          <SleepyQuickAdjustSVG />
        </>
      }
    />
  )
}