import { Text, View } from "react-native";
import { AccordionDropdown } from "../../../../Components";
import { WaveDelaySVG } from "../../../../Components/SVG/WaveDelaySVG";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function WaveDelay() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"wave"}
      headerText="Wave Delay"
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
            Wave Delay affects the timing of Left and Right Waves. The delay is a multiplier based on the length of time it takes to move the headlights completely.
          </Text>
          <WaveDelaySVG />

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
              • Delay of 0% will behave as a "Blink" action.{"\n"}
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
              • Delay of 50% will wait until the first headlight has moved half way before beginning movement.
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
              • Delay of 100% will wait until the first headlight has moved completely before beginning movement.
            </Text>
          </View>


          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            If a slider is troublesome to use, quick settings can be used with values of Fast, Medium, Slow, and Slowest, being 25%, 50%, 75%, and 100% respectively.
          </Text>
        </>
      }
    />
  )
}