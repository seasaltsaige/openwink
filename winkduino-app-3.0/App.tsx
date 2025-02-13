import { StatusBar, Text, View } from 'react-native';
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
import AppInfo from './Pages/Settings/AppInfo';
import ModuleInfo from './Pages/Settings/ModuleInfo';
import ModuleSettings from './Pages/Settings/ModuleSettings';
import AppData from './Pages/Settings/AppData';

const Tab = createBottomTabNavigator();

const withStatusBar = (Component: React.FC, backgroundColor: string) => {
  return (props: any) => (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <Component {...props} />
    </View>
  );
};

function BottomTabs() {
  const { colorTheme } = useColorTheme();
  return (

    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={
        ({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: "home-outline" | "help-outline" | "settings-outline";

            if (route.name === "Home") iconName = 'home-outline' as const;
            else if (route.name === "Help") iconName = "help-outline" as const;
            else iconName = "settings-outline" as const;

            return <Ionicons name={iconName} size={size} color={focused ? colorTheme.buttonTextColor : colorTheme.disabledButtonColor} />
          },
          tabBarLabelStyle: {
            fontSize: 13
          },
          tabBarActiveTintColor: colorTheme.buttonTextColor,
          tabBarInactiveTintColor: colorTheme.disabledButtonColor,
          tabBarActiveBackgroundColor: colorTheme.buttonColor,
          headerShown: false,
          tabBarStyle: {
            height: 55,
            borderColor: colorTheme.backgroundPrimaryColor,
            backgroundColor: colorTheme.backgroundPrimaryColor,
          }
        })
      }
    >
      <Tab.Screen name='Home' component={withStatusBar(Home, colorTheme.backgroundPrimaryColor)} />
      <Tab.Screen name='Help' component={withStatusBar(HowToUse, colorTheme.backgroundPrimaryColor)} />
      <Tab.Screen name='Settings' component={withStatusBar(Settings, colorTheme.backgroundPrimaryColor)} />
    </Tab.Navigator>
  )
}

const Stack = createNativeStackNavigator();

function AppNavigator() {

  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: "slide_from_right",
      animationDuration: 100,
    }}>

      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="Theme" component={AppTheme} />
      <Stack.Screen name="AppInfo" component={AppInfo} />
      <Stack.Screen name="ModuleInfo" component={ModuleInfo} />
      <Stack.Screen name="ModuleSettings" component={ModuleSettings} />
      <Stack.Screen name="StoredData" component={AppData} />

      <Stack.Screen name="CreateCustomCommands" component={CreateCustomCommand} />
      <Stack.Screen name="CustomCommands" component={CustomCommand} />
      <Stack.Screen name="StandardCommands" component={StandardCommands} />
    </Stack.Navigator>
  )
}

/**
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
      pageName: "App Theme",
      navigationName: "Theme",
      pageSymbol: "color-fill-outline"
    },
    {
      pageName: "Module Settings",
      navigationName: "ModuleSettings",
      pageSymbol: "build-outline"
    },
    {
      pageName: "App Data",
      navigationName: "StoredData",
      pageSymbol: "finger-print-outline"
    }
 
 */

export default function App() {
  const { colorTheme } = useColorTheme();
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
