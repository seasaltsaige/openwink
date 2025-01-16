import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useColorTheme } from "../hooks/useColorTheme";

const NAV_ICON_SIZE = 27 as const;

export function NavigationBar() {

  const { colorTheme } = useColorTheme();

  const navigation = useNavigation();
  // console.log(navigation.getId());
  const state = navigation.getState();
  const route = state?.routeNames[state.index];
  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colorTheme.backgroundSecondaryColor,
        position: "absolute",
        bottom: 0,
        // marginLeft: "50%",
        // right: 0,
        marginInline: "auto",

        // right: 0,
        padding: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}
    >
      <Ionicons
        name="home"
        color={route === "Home" ? colorTheme.textColor : colorTheme.buttonColor}
        size={NAV_ICON_SIZE}
        onPress={() => navigation.dispatch(CommonActions.navigate("Home"))}
      />
      <Ionicons
        name="settings"
        color={route === "Settings" ? colorTheme.textColor : colorTheme.buttonColor}
        size={NAV_ICON_SIZE}
        onPress={() => navigation.dispatch(CommonActions.navigate("Settings"))}
      />
      <Ionicons
        name="information-circle"
        color={route === "Info" ? colorTheme.textColor : colorTheme.buttonColor}
        size={NAV_ICON_SIZE}
        onPress={() => navigation.dispatch(CommonActions.navigate("Info"))}
      // onPressIn={}
      />
      {/* 
// Home,
    // Settings,
    // ThemeSettings: AppTheme,
    // CustomCommands: CustomCommand,
    // CreateCustomCommand,
    // StandardCommands
 */}
    </View>
  );
}