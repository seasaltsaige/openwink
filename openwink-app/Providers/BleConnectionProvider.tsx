import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { BleManager, Device, ScanCallbackType, ScanMode } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import * as ExpoDevice from 'expo-device';
import base64 from 'react-native-base64';
import Toast from 'react-native-toast-message';
import {
  OTA_SERVICE_UUID,
  WINK_SERVICE_UUID,
  MODULE_SETTINGS_SERVICE_UUID,
  SCAN_TIME_SECONDS,
  PASSKEY_UUID,
  UNPAIR_UUID,
  CUSTOM_COMMAND_UUID,
} from '../helper/Constants';
import { AutoConnectStore, DeviceMACStore, MockBleStore } from '../Storage';
import { getDevicePasskey, sleep } from '../helper/Functions';
import { useBleMonitor } from './BleMonitorProvider';
import { MockBleManager } from '../Mock/MockBleSystem';
import DeviceInfo from 'react-native-device-info';
import Storage from '../Storage/Storage';

export type BleConnectionContextType = {
  device: Device | null;
  manager: BleManager;
  mac: string;
  isScanning: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  autoConnectEnabled: boolean;
  requestPermissions: () => Promise<boolean>;
  scanForModule: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: (showToast?: boolean) => Promise<void>;
  setAutoConnect: (enabled: boolean) => void;
  unpair: () => Promise<void>;
};

export const BleConnectionContext = createContext<BleConnectionContextType | null>(null);

export const useBleConnection = () => {
  const context = useContext(BleConnectionContext);
  if (!context) {
    throw new Error('useBleConnection must be used within BleConnectionProvider');
  }
  return context;
};

// Connection retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

const isSimulator = (): boolean => {
  return DeviceInfo.isEmulatorSync()
};

const shouldUseMockBle = (): boolean => {
  // Always use mock in simulator
  if (isSimulator()) {
    return true;
  }

  // In development mode, check the user preference
  if (__DEV__) {
    return MockBleStore.get();
  }

  // Never use mock in production
  return false;
};

const createBleManager = (): BleManager => {
  if (shouldUseMockBle()) {
    console.log('Using Mock BLE Manager');
    return new MockBleManager() as unknown as BleManager;
  }

  return new BleManager();
};

export const BleConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const manager = useMemo(() => createBleManager(), []);
  const { startMonitoring, stopMonitoring, readInitialValues } = useBleMonitor();

  const [device, setDevice] = useState<Device | null>(null);
  const [mac, setMac] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoConnectRef = useRef(autoConnectEnabled);

  // Keep ref in sync with state for async callbacks
  useEffect(() => {
    autoConnectRef.current = autoConnectEnabled;
  }, [autoConnectEnabled]);

  // Load persisted settings on mount
  useEffect(() => {
    const storedMac = DeviceMACStore.getStoredMAC();
    if (storedMac) {
      setMac(storedMac);
    }

    const storedAutoConnect = AutoConnectStore.get();
    if (storedAutoConnect !== null) {
      setAutoConnectEnabled(storedAutoConnect);
    }
  }, []);

  // Request Android 31+ permissions
  const requestAndroid31Permissions = useCallback(async () => {
    try {
      const bluetoothScanPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: 'Bluetooth Scan Permission',
          message: 'This app needs Bluetooth scanning to find your module.',
          buttonPositive: 'OK',
        }
      );

      const bluetoothConnectPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Bluetooth Connect Permission',
          message: 'This app needs Bluetooth connection permission.',
          buttonPositive: 'OK',
        }
      );

      const fineLocationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth scanning requires location access.',
          buttonPositive: 'OK',
        }
      );

      return (
        bluetoothScanPermission === 'granted' &&
        bluetoothConnectPermission === 'granted' &&
        fineLocationPermission === 'granted'
      );
    } catch (error) {
      console.error('Error requesting Android 31+ permissions:', error);
      return false;
    }
  }, []);

  // Request permissions based on platform
  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const apiLevel = ExpoDevice.platformApiLevel ?? -1;

      if (apiLevel < 31) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app requires Location Services to function correctly.',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (error) {
          console.error('Error requesting Android permissions:', error);
          return false;
        }
      } else {
        return await requestAndroid31Permissions();
      }
    }

    // iOS doesn't need manual permission requests for BLE
    return true;
  }, [requestAndroid31Permissions]);

  // Setup connection monitors and disconnect handler
  const setupConnection = useCallback(
    async (connection: Device) => {
      try {
        await startMonitoring(connection, () => {
          if (!device) {
            return;
          }

          console.log('Interrupting custom command');

          // updateActiveCommandName(null);

          // Notify device that command is no longer in progress
          device
            .writeCharacteristicWithoutResponseForService(
              WINK_SERVICE_UUID,
              CUSTOM_COMMAND_UUID,
              base64.encode('0')
            )
            .catch((error) => {
              console.error('Error sending interrupt signal:', error);
            });
        });

        // Wow that was stupid
        if (getDevicePasskey() !== "Not Paired")
          await connection.writeCharacteristicWithResponseForService(
            MODULE_SETTINGS_SERVICE_UUID,
            PASSKEY_UUID,
            base64.encode(getDevicePasskey()),
          );
        else
          await connection.writeCharacteristicWithResponseForService(
            MODULE_SETTINGS_SERVICE_UUID,
            PASSKEY_UUID,
            base64.encode("CLAIM"),
          );


        await readInitialValues(connection);

        // Once all is initialized and nothing failed, device has successfully connected.
        setIsConnected(true);

        // Setup disconnect handler
        connection.onDisconnected(async (err, disconnectedDevice) => {
          if (err) {
            console.error('Disconnect error:', err);
          }

          console.log('Device disconnected:', disconnectedDevice?.id);

          // Cleanup
          stopMonitoring();
          setDevice(null);
          setIsConnected(false);

          // Auto-reconnect if enabled
          if (autoConnectRef.current) {
            console.log('Auto-reconnect enabled, scanning...');
            await scanForModule();
          }
        });
      } catch (error) {
        console.error('Error setting up connection:', error);
        throw error;
      }
    },
    [startMonitoring, stopMonitoring, device]
  );

  // Connect to a specific device with retry logic
  const connectToDevice = useCallback(
    async (deviceId: string) => {
      if (isConnecting || device) {
        console.log('Already connecting or connected');
        return;
      }

      setIsConnecting(true);

      try {
        console.log(`Connecting to device ${deviceId}`);

        const connection = await manager.connectToDevice(deviceId);
        await connection.discoverAllServicesAndCharacteristics();

        // Setup monitoring and handlers
        await setupConnection(connection);

        // Negotiate MTU to maximum size if android device. 
        const negotiatedMTUConnection = await connection.requestMTU(517);
        setDevice(negotiatedMTUConnection);

        setIsConnecting(false);

        // Store MAC and update state after connection establishes
        DeviceMACStore.setMAC(connection.id);
        setMac(connection.id);

        Toast.show({
          type: 'success',
          text1: 'Connected',
          text2: 'Successfully connected to module.',
          visibilityTime: 3000,
        });
      } catch (error) {
        setDevice(null);
        setIsConnecting(false);

        Toast.show({
          type: 'error',
          text1: 'Connection Failed',
          text2: 'Could not connect to module. Please try again.',
          visibilityTime: 5000,
        });

        // If auto-connect is enabled, start scanning again
        if (autoConnectRef.current) {
          setIsScanning(true);
          await scanForModule();
        }

      }
    },
    [device, isConnecting, manager, setupConnection]
  );

  // Check if device matches connection criteria
  const isValidDevice = useCallback(
    (scannedDevice: Device, targetMac: string | null): boolean => {
      // Check if MAC matches
      if (targetMac && scannedDevice.id === targetMac)
        return true;

      // if there is no stored MAC address, and scanned device has required service uuids
      else if (scannedDevice.serviceUUIDs && targetMac === null)
        return (
          scannedDevice.serviceUUIDs.includes(OTA_SERVICE_UUID) &&
          scannedDevice.serviceUUIDs.includes(WINK_SERVICE_UUID) &&
          scannedDevice.serviceUUIDs.includes(MODULE_SETTINGS_SERVICE_UUID)
        );
      else
        return false;
    },
    []
  );

  // Scan for module
  const scanForModule = useCallback(async () => {
    // Prevent multiple simultaneous scans
    if (device !== null || isScanning || isConnecting) {
      console.log('Scan already in progress or device connected');
      return;
    }

    setIsScanning(true);
    const targetMac = DeviceMACStore.getStoredMAC();
    let deviceFound = false;

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    console.log('Starting scan for module...');

    // Setup scan timeout
    scanTimeoutRef.current = setTimeout(async () => {
      if (!deviceFound) {
        console.log('Scan timeout reached, no device found');

        try {
          await manager.stopDeviceScan();
        } catch (error) {
          console.error('Error stopping scan:', error);
        }

        setIsScanning(false);
        setIsConnecting(false);

        // Restart scan if auto-connect is enabled
        if (autoConnectRef.current) {
          console.log('Auto-connect enabled, restarting scan...');
          await scanForModule();
        } else {
          Toast.show({
            type: 'info',
            text1: 'No Module Found',
            text2: 'Could not find module. Please try again.',
            visibilityTime: 4000,
          });
        }
      }
    }, SCAN_TIME_SECONDS);

    // Start scanning
    manager.startDeviceScan(
      null,
      {
        allowDuplicates: false,
        callbackType: ScanCallbackType.FirstMatch,
        legacyScan: false,
        scanMode: ScanMode.LowLatency,
      },
      async (error, scannedDevice) => {
        if (error) {
          console.error('Scan error:', error);

          // Stop scanning on error
          deviceFound = true; // Prevent timeout from restarting
          setIsScanning(false);

          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
          }

          Toast.show({
            type: 'error',
            text1: 'Scan Error',
            text2: 'An error occurred while scanning. Please try again.',
            visibilityTime: 4000,
          });
          return;
        }

        if (scannedDevice && !deviceFound) {
          if (isValidDevice(scannedDevice, targetMac)) {
            console.log('Valid device found:', scannedDevice.id);
            deviceFound = true;

            // Clear timeout
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
            }

            try {
              await manager.stopDeviceScan();
              setIsScanning(false);
              await connectToDevice(scannedDevice.id);
            } catch (error) {
              console.error('Error during connection process:', error);
              setIsScanning(false);
            }
          }
        }
      }
    );
  }, [device, isScanning, isConnecting, manager, connectToDevice, isValidDevice]);

  // Disconnect from device
  const disconnect = useCallback(
    async (showToast: boolean = true) => {
      if (!device) {
        console.log('No device to disconnect from');
        return;
      }

      try {
        const isConnected = await device.isConnected();

        if (isConnected) {
          console.log('Disconnecting from device... (From Disconnect Function)');
          stopMonitoring();
          await device.cancelConnection();
          setIsConnected(false);

          if (showToast) {
            Toast.show({
              type: 'info',
              text1: 'Module Disconnected',
              text2: 'Successfully disconnected from Open Wink Module.',
              visibilityTime: 3000,
            });
          }
        }
      } catch (error) {
        console.error('Error disconnecting:', error);
      } finally {
        setDevice(null);
      }
    },
    [device, stopMonitoring]
  );

  // Set auto-connect preference
  const setAutoConnect = useCallback((enabled: boolean) => {
    console.log('Auto-connect:', enabled);
    setAutoConnectEnabled(enabled);
    AutoConnectStore.set(enabled);
  }, []);

  // Unpair from module (forgets device MAC)
  const unpair = useCallback(async () => {

    // Always remove from app, allows unpair when not connected
    DeviceMACStore.forgetMAC();
    setMac("");
    Storage.delete("device-passkey");

    console.log("MAC Erased");


    if (device !== null) {
      try {
        await device.writeCharacteristicWithoutResponseForService(
          MODULE_SETTINGS_SERVICE_UUID,
          UNPAIR_UUID,
          base64.encode('0')
        );

        await device.cancelConnection().catch((err) => {
          console.log('Disconnect after unpair:', err);
        });
      } catch (err) {
        console.log("Error sending unpair to mcu: ", err);
      }
    }

    Toast.show({
      type: 'success',
      text1: 'Module Unpaired',
      text2: 'Successfully unpaired from module.',
      visibilityTime: 3000,
    });
  }, [device]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      manager.stopDeviceScan().catch(err =>
        console.error('Error stopping scan on unmount:', err)
      );

      if (device) {
        device.cancelConnection().catch(err =>
          console.error('Error disconnecting on unmount:', err)
        );
      }
    };
  }, [device, manager]);

  const value: BleConnectionContextType = {
    device,
    manager,
    mac,
    isScanning,
    isConnecting,
    autoConnectEnabled,
    isConnected,
    requestPermissions,
    scanForModule,
    connectToDevice,
    disconnect,
    setAutoConnect,
    unpair,
  };

  return (
    <BleConnectionContext.Provider value={value}>
      {children}
    </BleConnectionContext.Provider>
  );
};
