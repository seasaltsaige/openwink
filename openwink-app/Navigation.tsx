import { useEffect } from "react";
import { StatusBar, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PlatformPressable, Text } from "@react-navigation/elements";
import { useBLE } from "./hooks/useBLE";
import { useColorTheme } from "./hooks/useColorTheme";
import { useLinkBuilder } from "@react-navigation/native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  AppTheme,
  CreateCustomCommand,
  CustomCommand,
  Home,
  HowToUse,
  Information,
  ModuleSettings,
  Settings,
  TermsOfUse,
  StandardCommands,
  CustomWinkButton,
  WaveDelaySettings,
  SleepyEyeSettings,
} from "./Pages";

const Tab = createBottomTabNavigator();

const withStatusBar = (Component: React.FC, backgroundColor: string) => {
  return (props: any) => (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <Component {...props} />
    </View>
  );
};

const CustomBottomTabs = ({ descriptors, insets, navigation, state }: BottomTabBarProps) => {
  const { colorTheme, theme } = useColorTheme();
  const { buildHref } = useLinkBuilder();

  return <View style={theme.bottomTabsBackground}>

    {
      state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented)
            navigation.navigate(route.name, route.params);
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });

        };


        let iconName: any;

        if (route.name === "Home") iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === "Help") iconName = isFocused ? "help-circle" : "help-circle-outline" as const;
        else iconName = isFocused ? "settings" : "settings-outline" as const;

        return (
          <PlatformPressable
            style={theme.platformPressableView}
            key={index}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
          >
            <View style={isFocused ? theme.bottomTabsPillActive : theme.bottomTabsPill}>
              <Ionicons name={iconName} size={26} color={isFocused ? colorTheme.buttonColor : colorTheme.headerTextColor} />
              {
                isFocused ? (
                  <Text style={theme.bottomTabsPillFocusedText}>
                    {route.name}
                  </Text>
                ) : <></>
              }
            </View>
          </PlatformPressable>
        )
      })
    }

  </View >


}


function BottomTabs() {
  const { colorTheme } = useColorTheme();
  return (

    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomBottomTabs {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name='Home' component={withStatusBar(Home, colorTheme.backgroundPrimaryColor)} />
      <Tab.Screen name='Help' component={withStatusBar(HowToUse, colorTheme.backgroundPrimaryColor)} />
      <Tab.Screen name='Settings' component={withStatusBar(Settings, colorTheme.backgroundPrimaryColor)} />
    </Tab.Navigator>
  )
}

const Stack = createNativeStackNavigator();

export function AppNavigator() {

  const { disconnectFromModule } = useBLE();
  useEffect(() => {
    return () => { disconnectFromModule() };
  }, []);
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: "slide_from_right",
      animationDuration: 100,
    }}
    >

      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="Theme" component={AppTheme} />
      <Stack.Screen name="Info" component={Information} />
      <Stack.Screen name="TermsOfUse" component={TermsOfUse} />

      <Stack.Screen name="CreateCustomCommands" component={CreateCustomCommand} />
      <Stack.Screen name="CustomCommands" component={CustomCommand} />
      <Stack.Screen name="StandardCommands" component={StandardCommands} />

      <Stack.Screen name="ModuleSettings" component={ModuleSettings} />
      <Stack.Screen name="WaveDelaySettings" component={WaveDelaySettings} />
      <Stack.Screen name="SleepyEyeSettings" component={SleepyEyeSettings} />
      <Stack.Screen name="CustomWinkButton" component={CustomWinkButton} />

    </Stack.Navigator>
  )
}

