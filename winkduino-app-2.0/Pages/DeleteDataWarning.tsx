import { Modal, StyleSheet, Text, View } from "react-native";
import { OpacityButton } from "../Components/OpacityButton";

interface Props {
    visible: boolean;
    delete: () => void;
    close: () => void;
}
export function DeleteDataWarning(props: Props) {
    return (
        <Modal
            visible={props.visible}
            transparent
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            animationType="slide"
            onRequestClose={() => props.close()}
        >

            <View style={{ height: "100%", backgroundColor: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <View
                    style={{
                        width: "80%",
                        height: "50%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-evenly",
                        backgroundColor: "rgb(30, 30, 30)",
                        borderRadius: 10,
                        padding: 10,
                        rowGap: 15,
                        shadowColor: 'black',
                        shadowOpacity: 0.26,
                        shadowOffset: { width: 3, height: 4 },
                        shadowRadius: 1,
                        elevation: 3,
                    }}>
                    <View style={{ display: "flex", alignItems: "center", justifyContent: "center", rowGap: 10 }}>
                        <Text style={{ ...styles.text, fontSize: 30, textShadowColor: "rgb(", textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 }}>Delete all Data</Text>
                        <Text style={{ color: "red", fontWeight: "bold", textAlign: "center", fontSize: 18 }}>WARNING:{"\n"}This action is destructive and irreversible.{"\n"}All Custom Commands, device pairings, and stored data will be forgotten.</Text>
                        <OpacityButton
                            text="Delete"
                            buttonStyle={{ ...styles.button, width: 150, backgroundColor: "#de142c" }}
                            textStyle={{ ...styles.buttonText, fontWeight: "bold" }}
                            onPress={() => { props.delete(); props.close(); }}
                        />
                    </View>

                    <OpacityButton
                        buttonStyle={{ ...styles.button, marginTop: 40 }}
                        text="Cancel"
                        onPress={() => props.close()}
                        textStyle={styles.buttonText}
                    />
                </View>
            </View>

        </Modal>
    )
}

const styles = StyleSheet.create({
    text: {
        color: "white",
        fontSize: 23,
        fontWeight: "bold",
        textAlign: "center",
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
    buttonText: {
        color: "white",
        fontSize: 20,
    },
})