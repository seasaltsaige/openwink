import { useTheme } from "@react-navigation/native";
import { Modal, SafeAreaView, Text, View } from "react-native"
import { useColorTheme } from "../hooks/useColorTheme";
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

export function Settings() {

  const { colorTheme } = useColorTheme();
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [popupHeader, setPopupHeader] = useState("");
  return (
    <>
      <View
        style={{
          backgroundColor: colorTheme.backgroundPrimaryColor,
          height: "100%",
          padding: 10,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: "bold",
              color: colorTheme.headerTextColor
            }}
          >Settings</Text>
          {/* <ion-icon name="chevron-back-circle-outline"></ion-icon> */}
          <Ionicons name="caret-back" />
        </View>

      </View>
      <InfoPopup
        body={popupText}
        header={popupHeader}
        visible={popupOpen}
        close={() => { setPopupText(""); setPopupHeader(""); setPopupOpen(false); }}
      />
    </>
  );
}