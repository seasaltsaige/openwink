import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from "expo-font";
import {
  IBMPlexSans_700Bold,
  IBMPlexSans_500Medium,
  IBMPlexSans_400Regular,
  IBMPlexSans_300Light
} from "@expo-google-fonts/ibm-plex-sans";
import { PortalProvider } from '@gorhom/portal';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BleCommandProvider } from './Providers/BleCommandProvider';
import { BleMonitorProvider } from './Providers/BleMonitorProvider';
import { BleConnectionProvider } from './Providers/BleConnectionProvider';
import { ThemeProvider } from './Providers/ThemeProvider';
import { AppNavigator } from './Navigation';
import { OTAUpdateProvider } from './Providers/OTAUpdateProvider';
import { CustomButtonFrequencyStore, ThemeStore } from './Storage';
import { ThemedSplash, splashBackgroundByTheme } from './Components/ThemedSplash';

SplashScreen.preventAutoHideAsync();

const isIOS = Platform.OS === "ios";
const initialThemeName = ThemeStore.getStoredTheme();

export default function App() {

  const [loaded] = useFonts({
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_700Bold,
  });

  const [splashHidden, setSplashHidden] = useState(!isIOS);

  useEffect(() => {
    CustomButtonFrequencyStore.decay();
  }, []);

  // iOS LaunchScreen is static, so a JS overlay drives the themed splash —
  // its onLayout hides the native screen as soon as the overlay is on screen.
  // Android's native SplashScreen API already renders the per-theme icon and
  // background via the dynamic-splash-theme plugin, so we just hide it once
  // fonts are ready.
  const handleOverlayLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isIOS && loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: splashBackgroundByTheme[initialThemeName] }}>
        {loaded && (
          <NavigationContainer>
            <BleMonitorProvider>
              <BleConnectionProvider>
                <BleCommandProvider>
                  <OTAUpdateProvider>
                    <ThemeProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <PortalProvider>
                          <AppNavigator />
                        </PortalProvider>
                      </GestureHandlerRootView>
                    </ThemeProvider>
                  </OTAUpdateProvider>
                </BleCommandProvider>
              </BleConnectionProvider>
            </BleMonitorProvider>
          </NavigationContainer>
        )}
        {isIOS && !splashHidden && (
          <ThemedSplash
            themeName={initialThemeName}
            contentReady={loaded}
            onLayout={handleOverlayLayout}
            onHidden={() => setSplashHidden(true)}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}
