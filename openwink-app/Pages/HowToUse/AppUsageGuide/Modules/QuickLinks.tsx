import { Text } from "react-native";
import { QuickLinksSVG } from "../../../../Components/SVG";
import { AccordionDropdown } from "../../../../Components";
import { useColorTheme } from "../../../../hooks/useColorTheme";

export function QuickLinks() {
  const { colorTheme } = useColorTheme();
  return (
    <AccordionDropdown
      key={"quick_links"}
      headerText="Quick Links Customization"
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
            The "Quick Links" section allows you to customize which module settings you would prefer to have displayed on the home screen for ease of access.
          </Text>
          <QuickLinksSVG />

          <Text
            style={{
              color: `${colorTheme.headerTextColor}99`,
              fontFamily: "IBMPlexSans_400Regular",
              width: "100%",
              textAlign: "left",
              fontSize: 15,
            }}
          >
            You are able to choose from up to seven pages. Pressing on the "eye" icon will hide or show the quick link, while the drag bars allow you to change the order the pages are displayed in.
          </Text>

        </>
      }
    />
  )
}