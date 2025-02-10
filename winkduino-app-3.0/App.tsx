import { Text, View } from 'react-native';
import { createStaticNavigation, NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  AppTheme,
  CreateCustomCommand,
  CustomCommand,
  Home,
  HowToUse,
  Settings,
  StandardCommands,
} from "./Pages";
import { useColorTheme } from './hooks/useColorTheme';

const Tab = createBottomTabNavigator();

function BottomTabs() {
  const { colorTheme } = useColorTheme();
  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: "home-outline" | "information-circle-outline" | "settings-outline";

          if (route.name === "Home") {
            iconName = 'home-outline'
          } else if (route.name === "Info") iconName = "information-circle-outline" as const;
          else iconName = "settings-outline" as const;

          return <Ionicons name={iconName} size={size} color={focused ? colorTheme.buttonTextColor : colorTheme.disabledButtonColor} />
        },
        tabBarActiveBackgroundColor: colorTheme.buttonColor,
        tabBarInactiveBackgroundColor: colorTheme.buttonColor,
        tabBarLabelStyle: {
          color: colorTheme.buttonTextColor,
        },
        headerShown: false,
        animation: "fade",
      })}
    >
      <Tab.Screen name='Home' component={Home} />
      <Tab.Screen name='Info' component={HowToUse} />
      <Tab.Screen name='Settings' component={Settings} />
    </Tab.Navigator>
  )
}

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="Theme" component={AppTheme} />
      <Stack.Screen name="CreateCustomCommands" component={CreateCustomCommand} />
      <Stack.Screen name="CustomCommands" component={CustomCommand} />
      <Stack.Screen name="StandardCommands" component={StandardCommands} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
