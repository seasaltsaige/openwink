import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from "expo-font";
import { IBMPlexSans_700Bold, IBMPlexSans_500Medium, IBMPlexSans_400Regular, IBMPlexSans_300Light } from "@expo-google-fonts/ibm-plex-sans";
import { BleProvider } from './Providers/BleProvider';
import { ThemeProvider } from './Providers/ThemeProvider';
import { AppNavigator } from './Navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {

  const [loaded, error] = useFonts({
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_700Bold,
  });

  if (!loaded) return null;

  return (
    <NavigationContainer>
      <BleProvider>
        <ThemeProvider>
          <GestureHandlerRootView>
            <AppNavigator />
          </GestureHandlerRootView>
        </ThemeProvider>
      </BleProvider>
    </NavigationContainer>
  );
}
