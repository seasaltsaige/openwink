import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from "expo-font";
import {
  IBMPlexSans_700Bold,
  IBMPlexSans_500Medium,
  IBMPlexSans_400Regular,
  IBMPlexSans_300Light
} from "@expo-google-fonts/ibm-plex-sans";
import { PortalProvider } from '@gorhom/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BleCommandProvider } from './Providers/BleCommandProvider';
import { BleMonitorProvider } from './Providers/BleMonitorProvider';
import { BleConnectionProvider } from './Providers/BleConnectionProvider';
import { ThemeProvider } from './Providers/ThemeProvider';
import { AppNavigator } from './Navigation';
import { OTAUpdateProvider } from './Providers/OTAUpdateProvider';
import { CustomButtonFrequencyStore } from './Storage';
import { useEffect } from 'react';

export default function App() {

  const [loaded, error] = useFonts({
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_700Bold,
  });


  useEffect(() => {
    // Decay frequencies on app startup (so that over time, if a new button action is used, it appears higher)
    CustomButtonFrequencyStore.decay();
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <BleMonitorProvider>
          <BleConnectionProvider>
            <BleCommandProvider>
              <OTAUpdateProvider>
                <ThemeProvider>
                  <GestureHandlerRootView>
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
    </SafeAreaProvider>
  );
}
