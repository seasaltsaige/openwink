import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useBLE } from './hooks/useBLE';
import { useEffect } from 'react';

export default function App() {

  const { requestPermissions, scan, connectedDevice, disconnect } = useBLE();

  const scanForDevice = async () => {
    const permsEnabled = await requestPermissions();
    if (permsEnabled) {
      // console.log(permsEnabled);
      scan();
    }
  }

  useEffect(() => {
    scanForDevice();
  }, []);

  return (
    <View style={styles.container}>
      {
        connectedDevice ?
          <Text> Hello {connectedDevice.name}</Text>
          : <Text>No Device Connected</Text>
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
