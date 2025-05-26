import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Modal, Pressable, Text, View } from "react-native"
import { useColorTheme } from "../../hooks/useColorTheme";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";


function InfoPopup(props: { visible: boolean; header: string; body: string; close: () => void; }) {
  const { colorTheme } = useColorTheme();

  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={() => props.close()}
      visible={props.visible}
      onDismiss={() => props.close()}
    >
      <View
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.5)"
        }}
      >
        <View
          style={{
            width: "80%",
            maxHeight: "50%",
            backgroundColor: colorTheme.backgroundSecondaryColor,
            borderRadius: 10,
            position: "absolute"
          }}
        >
          {/* Modal Popup Body */}

          <View
            style={{
              position: "relative",
              width: "100%",
              // height: "100%",
              display: 'flex',
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: 'center'
            }}
          >
            {/* Header */}
            <Text
              style={{
                color: colorTheme.headerTextColor,
                fontWeight: "bold",
                fontSize: 25,
                // width: "100%",
                // textAlign: "center",
                // verticalAlign: "middle"
              }}
            >{props.header}</Text>
            <Ionicons name="close-sharp" size={20} color={colorTheme.buttonTextColor} style={{ position: "absolute", top: 10, right: 10 }} />
          </View>
          <View
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            {/* Body */}
            <Text
              style={{
                color: colorTheme.textColor,
                fontSize: 15,
                margin: 5,
                maxWidth: "80%"
              }}
            >{props.body}</Text>
          </View>

        </View>
      </View>
    </Modal >
  )
}

// ["App Info", "Module Info", "App Theme", "Module Customization", "Stored Data"]

const settingsData: Array<{
  pageName: string;
  pageSymbol: string;
  navigationName: string;
}> = [
    {
      pageName: "App Info",
      navigationName: "AppInfo",
      pageSymbol: "information-circle-outline",
    },
    {
      pageName: "Module Info",
      navigationName: "ModuleInfo",
      pageSymbol: "information-circle-outline"
    },
    {
      pageName: "Module Settings",
      navigationName: "ModuleSettings",
      pageSymbol: "build-outline"
    },
    {
      pageName: "App Theme",
      navigationName: "Theme",
      pageSymbol: "color-fill-outline"
    },

    {
      pageName: "Terms Of Use",
      navigationName: "TermsOfUse",
      pageSymbol: "document-text-outline",
    },
    {
      pageName: "App Data",
      navigationName: "StoredData",
      pageSymbol: "finger-print-outline"
    }
  ]

export function Settings() {

  const { colorTheme, update } = useColorTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [popupHeader, setPopupHeader] = useState("");

  const navigate = useNavigation();
  const route = useRoute();

  useFocusEffect(() => {
    (async () => {
      await update();
    })();

    return () => { };
  });

  return (
    <>
      <View
        style={{
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
          padding: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: 25,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >

          <Text
            style={{
              fontSize: 40,
              fontWeight: "bold",
              color: colorTheme.headerTextColor,
              width: "100%",
            }}
          >Settings</Text>

        </View>

        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            rowGap: 15,
          }}
        >

          {
            settingsData.map((c, i) => (
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colorTheme.buttonColor : colorTheme.backgroundSecondaryColor,
                  width: "100%",
                  padding: 5,
                  paddingVertical: 13,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                })}
                //@ts-ignore
                onPress={() => navigate.navigate(c.navigationName, { back: route.name })}
                key={i}>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 10,
                    marginLeft: 10,
                  }}
                >

                  <Ionicons
                    // @ts-ignore
                    name={c.pageSymbol}
                    size={25}
                    color={colorTheme.headerTextColor}
                  />
                  <Text
                    style={{
                      color: colorTheme.headerTextColor,
                      fontWeight: "bold",
                      fontSize: 17,
                    }}
                  >{c.pageName}</Text>
                </View>
                <Ionicons style={{ marginRight: 10 }} name="chevron-forward-outline" size={20} color={colorTheme.headerTextColor} />
              </Pressable>
            ))
          }

        </View>

      </View  >
      <InfoPopup
        body={popupText}
        header={popupHeader}
        visible={popupOpen}
        close={() => { setPopupText(""); setPopupHeader(""); setPopupOpen(false); }}
      />
    </>
  );
}