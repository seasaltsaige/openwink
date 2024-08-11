import { Modal, ScrollView, StyleSheet, Text } from "react-native";
import { OpacityButton } from "../Components/OpacityButton";

interface SettingsProps {
  visible: boolean;
  close: () => void;
}

export function Settings(props: SettingsProps) {

  return (
    <Modal
      transparent={false}
      visible={props.visible}
      animationType="slide"
      hardwareAccelerated
    >
      <ScrollView style={{ backgroundColor: "rgb(20, 20, 20)", height: "100%", width: "100%" }} contentContainerStyle={{ display: "flex", alignItems: "center", justifyContent: "flex-start", rowGap: 20 }}>
        <OpacityButton
          buttonStyle={styles.button}
          textStyle={styles.buttonText}
          onPress={() => props.close()}
          text="Close"
        />
      </ScrollView>
    </Modal>
  )

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(20, 20, 20)',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 25,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-evenly",
  },
  commandColumns: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  commandRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 10,
  },
  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold"
  },
  commandButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#990033",
    borderRadius: 5,
    padding: 10,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#990033",
    width: 200,
    height: 50,
    borderRadius: 5,
  },
  buttonDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "grey",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
  },
  input: {
    backgroundColor: "rgb(40, 40, 40)",
    padding: 10,
    color: "#ffffff",
    textAlign: "center",
    width: 200,
    borderRadius: 5,
  }
});