import { ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { useColorTheme } from "../../hooks/useColorTheme";
import { HeaderWithBackButton } from "../../Components";

const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Acceptance & Changes to Terms",
    body:
      "By downloading, installing, or using the OpenWink mobile application and companion hardware module, you agree to be bound by these Terms of Use. These terms may be modified, amended, or replaced at any time at the sole discretion of the developers or authorized distributors (including via over-the-air application updates). Continued use of the application or hardware module following any changes constitutes your acceptance of the revised terms.",
  },
  {
    title: "2. Vehicle Safety & Responsible Operation",
    body:
      "Never interact with the OpenWink mobile application while operating a motor vehicle. Always ensure that areas around the headlight assemblies are clear of hands, tools, hood props, or obstructions before actuating the headlights. Custom animations, wink/wave sequences, and partial (\"Sleepy Eye\") headlight positions are intended strictly for off-road, parked, or show use. You are solely responsible for ensuring your vehicle's headlights remain fully raised and operational whenever required by law or road/lighting conditions.",
  },
  {
    title: "3. Installation & Firmware Updates",
    body:
      "Proper installation and maintenance of the OpenWink module are the responsibility of the vehicle owner or installer. Do not disconnect vehicle power, close the application, or interrupt power to the module while a firmware update is in progress.",
  },
  {
    title: "4. Privacy & Device Permissions",
    body:
      "OpenWink uses Bluetooth Low Energy (BLE) exclusively to discover, connect to, and communicate locally with your OpenWink hardware module. Network access is used solely to check for and download official application and module firmware updates. OpenWink does not collect, store, transmit, or sell personal information, analytics, or location data.",
  },
  {
    title: "5. Disclaimer of Warranty & Liability",
    body:
      "The OpenWink application and firmware are provided \"AS IS\" without warranty of any kind, express or implied. In no event shall the authors, developers, contributors, or retail distributors be held liable for any direct, indirect, incidental, or consequential damages, traffic citations, or vehicle/mechanical damage arising out of the installation, use, or misuse of this software or hardware.",
  },
];

export function TermsOfUse() {

  const { theme, colorTheme } = useColorTheme();

  const route = useRoute();
  //@ts-ignore
  const { back } = route.params;

  return (
    <View style={theme.container}>
      <HeaderWithBackButton
        backText={back}
        headerText="Terms of Use"
      />
      <View style={{
        paddingBottom: 50,
        width: "100%",
        flex: 1,
      }}>
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={[
            theme.infoContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {TERMS_SECTIONS.map((section) => (
            <View key={section.title} style={[theme.infoBoxOuter, { width: "100%" }]}>
              <Text style={[theme.infoBoxOuterText, { fontSize: 17 }]}>
                {section.title}
              </Text>
              <View style={[theme.infoBoxInner, { paddingVertical: 12 }]}>
                <Text
                  style={{
                    color: `${colorTheme.headerTextColor}CC`,
                    fontFamily: "IBMPlexSans_400Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  {section.body}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}