import { Text, View } from 'react-native';
import { createStaticNavigation, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import {
  AppTheme,
  CreateCustomCommand,
  CustomCommand,
  Home,
  HowToUse,
  Settings,
  StandardCommands,
} from "./Pages";

const nativeStack = createNativeStackNavigator({
  initialRouteName: "Home",
  screenOptions: {
    animation: "fade",
    // animationDuration: 500,
    headerShown: false,
  },
  screens: {
    Home,
    Settings,
    ThemeSettings: AppTheme,
    CustomCommands: CustomCommand,
    CreateCustomCommand,
    StandardCommands,
    Info: HowToUse
  }
});

const Navigator = createStaticNavigation(nativeStack);

export default function App() {

  return (
    <Navigator />
  );
}
