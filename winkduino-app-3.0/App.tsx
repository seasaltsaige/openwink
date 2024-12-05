import { Text, View } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  Home,
} from "./Pages";

const nativeStack = createNativeStackNavigator({
  initialRouteName: "Home",
  screenOptions: {
    animation: "slide_from_right",
    headerShown: false,
  },
  screens: {
    Home: Home
  }
});

const Navigator = createStaticNavigation(nativeStack);

export default function App() {
  return (
    <Navigator />
  );
}
