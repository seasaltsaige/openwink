import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  BleManager,
  Device,
  ScanCallbackType,
  ScanMode,
} from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import Toast from "react-native-toast-message";
import { BLE, CANCEL_COMMAND_PAYLOAD, getBLEDescriptors, SCAN_TIME_SECONDS, SettingFlag } from "../helper/Constants";
import {
  AutoConnectStore,
  AuxButtonStore,
  CustomOEMButtonStore,
  CustomWaveStore,
  DeviceMACStore,
  FirmwareStore,
  HeadlightMovementSpeedStore,
  HeadlightOrientationStore,
  SleepyEyeStore,
} from "../Storage";
import { bytesToBase64, getDevicePasskey, sleep } from "../helper/Functions";
import { useBleMonitor } from "./BleMonitorProvider";
import DeviceInfo from "react-native-device-info";
import { DeviceUUIDStore } from "../Storage/DeviceUUIDStore";
import { OTA } from "../helper/Handlers/OTA";

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
  updateProfile: () => Promise<void>;
  refreshConnection: () => Promise<void>;
};

export const BleConnectionContext =
  createContext<BleConnectionContextType | null>(null);

export const useBleConnection = () => {
  const context = useContext(BleConnectionContext);
  if (!context) {
    throw new Error(
      "useBleConnection must be used within BleConnectionProvider",
    );
  }
  return context;
};

const createBleManager = (): BleManager => {
  return new BleManager();
};

export const BleConnectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const manager = useMemo(() => createBleManager(), []);
  const {
    startMonitoring,
    stopMonitoring,
    readInitialValues,
    writeInitialSettings,
    refreshMonitorStatus,
  } = useBleMonitor();

  const [device, setDevice] = useState<Device | null>(null);
  const [mac, setMac] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  // const [isConnected, setIsConnected] = useState(true);

  const isConnectedRef = useRef(isConnected);
  const deviceRef = useRef<Device | null>(null);
  const scanForModuleRef = useRef<() => Promise<void>>(async () => { });

  const updateDevice = useCallback((nextDevice: Device | null) => {
    deviceRef.current = nextDevice;
    setDevice(nextDevice);
  }, []);

  const setConnected = (connected: boolean) => {
    setIsConnected(connected);
    isConnectedRef.current = connected;
  }

  const clearStaleOsConnections = useCallback(async (targetMac?: string | null) => {
    try {
      const staleIds = new Set<string>();

      if (targetMac) {
        const isTargetConnected = await manager.isDeviceConnected(targetMac).catch(() => false);
        if (isTargetConnected) {
          staleIds.add(targetMac);
        }
      }

      const connectedDevices = await manager
        .connectedDevices([
          BLE.SERVICES.WINK.UUID,
          BLE.SERVICES.SETTINGS.UUID,
          BLE.SERVICES.OTA.UUID,
        ])
        .catch(() => []);

      for (const dev of connectedDevices) {
        if (dev?.id) {
          staleIds.add(dev.id);
        }
      }

      if (staleIds.size > 0) {
        for (const id of staleIds) {
          console.log("Cancelling stale OS BLE connection:", id);
          await manager.cancelDeviceConnection(id).catch(() => { });
        }
        await sleep(300);
      }
    } catch (err) {
      console.warn("Error clearing stale OS BLE connections:", err);
    }
  }, [manager]);

  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoConnectRef = useRef(autoConnectEnabled);
  const intentionalDisconnectRef = useRef(false);

  // Keep ref in sync with state for async callbacks
  useEffect(() => {
    autoConnectRef.current = autoConnectEnabled;
  }, [autoConnectEnabled]);

  // Load persisted settings on mount and clean up any orphaned OS BLE link from JS reload
  useEffect(() => {
    const storedMac = DeviceMACStore.getStoredMAC();
    if (storedMac) {
      setMac(storedMac);
    }

    const storedAutoConnect = AutoConnectStore.get();
    if (storedAutoConnect !== null) {
      setAutoConnectEnabled(storedAutoConnect);
    }

    clearStaleOsConnections(storedMac);
  }, [clearStaleOsConnections]);

  const refreshConnection = useCallback(async () => {
    const storedMac = DeviceMACStore.getStoredMAC();
    const autoConnect = AutoConnectStore.get();

    setMac(storedMac ?? "");
    setAutoConnect(autoConnect);
  }, []);

  // Request Android 31+ permissions
  const requestAndroid31Permissions = useCallback(async () => {
    try {
      const bluetoothScanPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: "Bluetooth Scan Permission",
          message: "This app needs Bluetooth scanning to find your module.",
          buttonPositive: "OK",
        },
      );

      const bluetoothConnectPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: "Bluetooth Connect Permission",
          message: "This app needs Bluetooth connection permission.",
          buttonPositive: "OK",
        },
      );

      const fineLocationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Bluetooth scanning requires location access.",
          buttonPositive: "OK",
        },
      );

      return (
        bluetoothScanPermission === "granted" &&
        bluetoothConnectPermission === "granted" &&
        fineLocationPermission === "granted"
      );
    } catch (error) {
      console.error("Error requesting Android 31+ permissions:", error);
      return false;
    }
  }, []);

  // Request permissions based on platform
  const requestPermissions = useCallback(async () => {
    if (Platform.OS === "android") {
      const apiLevel = ExpoDevice.platformApiLevel ?? -1;

      if (apiLevel < 31) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message:
                "This app requires Location Services to function correctly.",
              buttonPositive: "OK",
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (error) {
          console.error("Error requesting Android permissions:", error);
          return false;
        }
      } else {
        return await requestAndroid31Permissions();
      }
    }

    // iOS doesn't need manual permission requests for BLE
    return true;
  }, [requestAndroid31Permissions]);

  // Track the last startMonitoring reference bound by setupConnection so Fast Refresh
  // re-binds only when startMonitoring itself changes while already connected.
  const boundStartMonitoringRef = useRef<typeof startMonitoring | null>(null);

  const bindDeviceMonitors = useCallback(
    async (targetDevice: Device) => {
      boundStartMonitoringRef.current = startMonitoring;
      await startMonitoring(
        targetDevice,
        () => {
          if (!deviceRef.current) return;
          deviceRef.current
            .writeCharacteristicWithoutResponseForService(
              ...getBLEDescriptors("WINK", "CUSTOM_COMMAND"),
              bytesToBase64([CANCEL_COMMAND_PAYLOAD]),
            )
            .catch((error) => {
              console.error("Error sending interrupt signal:", error);
            });
        },
        async () => {
          intentionalDisconnectRef.current = true;
          DeviceUUIDStore.forgetUUID();
          DeviceMACStore.forgetMAC();
          FirmwareStore.forgetFirmwareVersion();
          CustomOEMButtonStore.removeAll();
          AuxButtonStore.reset();
          CustomWaveStore.reset();
          SleepyEyeStore.reset("both");
          HeadlightOrientationStore.disable();
          HeadlightMovementSpeedStore.reset();
          await refreshMonitorStatus();
          setMac("");
          try {
            await targetDevice.cancelConnection();
            Toast.show({
              type: "info",
              text1: "Module Factory Reset",
              text2: "Module was reset to factory defaults.",
              visibilityTime: 4000,
            });
          } catch (err) {
            console.log(err, "Error disconnecting on reset");
          }
        },
      );
    },
    [startMonitoring, refreshMonitorStatus],
  );

  // Re-bind characteristic monitors ONLY if startMonitoring updates during Fast Refresh while connected
  useEffect(() => {
    const activeDevice = deviceRef.current;
    if (!isConnected || !activeDevice) return;
    if (boundStartMonitoringRef.current === startMonitoring) return;

    bindDeviceMonitors(activeDevice);
  }, [isConnected, startMonitoring, bindDeviceMonitors]);

  const setupConnection = useCallback(
    async (connection: Device) => {
      try {
        await bindDeviceMonitors(connection);


        // Setup disconnect handler
        connection.onDisconnected(async (err, disconnectedDevice) => {
          if (err) {
            console.error("Disconnect error:", err);
          }

          console.log("Device disconnected:", disconnectedDevice?.id);

          // Cleanup
          stopMonitoring();
          updateDevice(null);
          setConnected(false);

          if (intentionalDisconnectRef.current && !OTA.restartQueued) {
            intentionalDisconnectRef.current = false;
            return;
          }
          intentionalDisconnectRef.current = false;

          // Auto-reconnect if enabled
          if (autoConnectRef.current || OTA.restartQueued) {
            OTA.restartQueued = false;
            await sleep(1500);
            await scanForModuleRef.current();
          }
        });


        if (getDevicePasskey() !== "Not Paired") {
          await connection.writeCharacteristicWithResponseForService(
            ...getBLEDescriptors("SETTINGS", "AUTH"),
            base64.encode(getDevicePasskey()),
          );

          try {
            await writeInitialSettings(connection);
          } catch (error) {
            console.warn(
              "[BLE] Non-critical write failed during initial settings:",
              error,
            );
          }
        }

        await readInitialValues(connection);
      } catch (error) {
        console.error("Error setting up connection:", error);
        throw error;
      }
    },
    [
      bindDeviceMonitors,
      stopMonitoring,
      updateDevice,
      writeInitialSettings,
      readInitialValues,
    ],
  );

  // Connect to a specific device with retry logic
  const connectToDevice = useCallback(
    async (deviceId: string) => {
      if (isConnecting || isConnectedRef.current) {
        console.log("Already connecting or connected");
        return;
      }

      setIsConnecting(true);
      intentionalDisconnectRef.current = false;

      try {
        console.log(`Connecting to device ${deviceId}`);

        const connection = await manager.connectToDevice(deviceId);
        await connection.discoverAllServicesAndCharacteristics();

        // Negotiate MTU to maximum size if android device.
        const negotiatedMTUConnection = await connection.requestMTU(517);
        updateDevice(negotiatedMTUConnection);

        // Setup monitoring and handlers
        await setupConnection(negotiatedMTUConnection);


        // Store MAC and update state after connection establishes
        DeviceMACStore.setMAC(connection.id);
        setMac(connection.id);
        setIsConnecting(false);
        setConnected(true);

        Toast.show({
          type: "success",
          text1: "Connected",
          text2: "Successfully connected to module.",
          visibilityTime: 3000,
        });
      } catch (error) {
        stopMonitoring();
        setConnected(false);
        updateDevice(null);
        setIsConnecting(false);

        Toast.show({
          type: "error",
          text1: "Connection Failed",
          text2: "Could not connect to module. Please try again.",
          visibilityTime: 5000,
        });

        // If auto-connect is enabled, start scanning again
        if (autoConnectRef.current) {
          await scanForModuleRef.current();
        }
      }
    },
    [isConnecting, manager, setupConnection, stopMonitoring, updateDevice],
  );

  // Check if a scanned device advertises all required OpenWink services
  const hasOpenWinkServices = useCallback((scannedDevice: Device): boolean => {
    if (!scannedDevice.serviceUUIDs) return false;
    return (
      scannedDevice.serviceUUIDs.includes(BLE.SERVICES.OTA.UUID) &&
      scannedDevice.serviceUUIDs.includes(BLE.SERVICES.WINK.UUID) &&
      scannedDevice.serviceUUIDs.includes(BLE.SERVICES.SETTINGS.UUID)
    );
  }, []);

  // Check if device matches connection criteria
  const isValidDevice = useCallback(
    (scannedDevice: Device, targetMac: string | null): boolean => {
      // Check if MAC matches
      if (targetMac && scannedDevice.id === targetMac) return true;
      // if there is no stored MAC address, and scanned device has required service uuids
      else if (targetMac === null && hasOpenWinkServices(scannedDevice))
        return true;
      else return false;
    },
    [hasOpenWinkServices],
  );

  // Scan for module
  const scanForModule = useCallback(async () => {
    // Prevent multiple simultaneous scans
    if (isConnectedRef.current || isScanning || isConnecting) {
      console.log("Scan already in progress or device connected");
      return;
    }


    try {
      await manager.stopDeviceScan();
    } catch (err) {
      console.log("Failed to stop device scan pre-scan start: ", err);
    }

    setIsScanning(true);
    intentionalDisconnectRef.current = false;
    const targetMac = DeviceMACStore.getStoredMAC();
    await clearStaleOsConnections(targetMac);
    let deviceFound = false;
    let mismatchedModuleSeen = false;

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }



    // Setup scan timeout
    scanTimeoutRef.current = setTimeout(async () => {

      if (!deviceFound) {
        console.log("Scan timeout reached, no device found");

        try {
          await manager.stopDeviceScan();
        } catch (error) {
          console.error("Error stopping scan:", error);
        }

        setIsScanning(false);
        setIsConnecting(false);

        if (mismatchedModuleSeen) {
          Toast.show({
            type: "info",
            text1: "Paired Module Not Found",
            text2:
              "Found a different OpenWink module nearby. Use Forget Module in Settings to pair with it.",
            visibilityTime: 5000,
          });
        }

        // Restart scan if auto-connect is enabled
        const autoConnectEnabled = AutoConnectStore.get();
        setAutoConnectEnabled(autoConnectEnabled);

        if (autoConnectEnabled) {
          console.log("Auto-connect enabled, restarting scan...");
          await scanForModuleRef.current();
        } else if (!mismatchedModuleSeen) {
          Toast.show({
            type: "info",
            text1: "No Module Found",
            text2: "Could not find module. Please try again.",
            visibilityTime: 4000,
          });
        }
      }
    }, SCAN_TIME_SECONDS);

    // Start scanning
    manager.startDeviceScan(
      null,
      {
        allowDuplicates: true,
        callbackType: ScanCallbackType.AllMatches,
        legacyScan: false,
        scanMode: ScanMode.LowLatency,
      },
      async (error, scannedDevice) => {


        if (error) {
          console.error("Scan error:", error);

          // Stop scanning on error
          deviceFound = true; // Prevent timeout from restarting
          setIsScanning(false);

          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
          }

          Toast.show({
            type: "error",
            text1: "Scan Error",
            text2: "An error occurred while scanning. Please try again.",
            visibilityTime: 4000,
          });
          return;
        }

        if (scannedDevice && !deviceFound) {
          if (isValidDevice(scannedDevice, targetMac)) {
            console.log("Valid device found:", scannedDevice.id);
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
              console.error("Error during connection process:", error);
              setIsScanning(false);
            }
          } else if (targetMac !== null && hasOpenWinkServices(scannedDevice)) {
            mismatchedModuleSeen = true;
          }
        }
      },
    );
  }, [
    isScanning,
    isConnecting,
    manager,
    connectToDevice,
    isValidDevice,
    hasOpenWinkServices,
    clearStaleOsConnections,
  ]);

  // Disconnect from device
  const disconnect = useCallback(
    async (showToast: boolean = true) => {
      if (!device) {
        console.log("No device to disconnect from");
        return;
      }

      try {
        const isConnected = await device.isConnected();

        if (isConnected) {
          console.log(
            "Disconnecting from device... (From Disconnect Function)",
          );
          intentionalDisconnectRef.current = true;
          stopMonitoring();
          await device.cancelConnection();
          updateDevice(null);
          setIsConnecting(false);
          setIsScanning(false);
          setConnected(false);

          if (showToast) {
            Toast.show({
              type: "info",
              text1: "Module Disconnected",
              text2: "Successfully disconnected from Open Wink Module.",
              visibilityTime: 3000,
            });
          }
        }
      } catch (error) {
        console.error("Error disconnecting:", error);
      } finally {
        updateDevice(null);
      }
    },
    [device, stopMonitoring, updateDevice],
  );

  // Set auto-connect preference
  const setAutoConnect = useCallback((enabled: boolean) => {
    setAutoConnectEnabled(enabled);
    if (!enabled) {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      manager
        .stopDeviceScan()
        .then(() => setIsScanning(false))
        .catch((err) => {
          console.error("Error during connection process:", err);
          setIsScanning(false);
        });
    }

    AutoConnectStore.set(enabled);
  }, [manager]);

  // Unpair from module (forgets device MAC)
  const unpair = useCallback(async () => {
    intentionalDisconnectRef.current = true;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    await manager.stopDeviceScan().catch(() => { });
    setIsScanning(false);

    // Always remove from app, allows unpair when not connected
    DeviceMACStore.forgetMAC();
    DeviceUUIDStore.forgetUUID();
    setMac("");
    FirmwareStore.forgetFirmwareVersion();

    console.log("MAC Erased");

    if (device !== null) {
      try {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("SETTINGS", "GENERAL_SETTINGS"),
          bytesToBase64([SettingFlag.UNPAIR]),
        );

        await device.cancelConnection().catch((err) => {
          console.log("Disconnect after unpair:", err);
        });
      } catch (err) {
        console.log("Error sending unpair to mcu: ", err);
      }
    }
  }, [device, manager]);

  const updateProfile = useCallback(async () => {
    if (!device) return;

    try {
      await writeInitialSettings(device);
    } catch (err) {
      console.log("Error updating profile on module: ", err);
    }
  }, [device]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      manager
        .stopDeviceScan()
        .catch((err) => console.error("Error stopping scan on unmount:", err));

      if (deviceRef.current) {
        deviceRef.current
          .cancelConnection()
          .catch((err) =>
            console.error("Error disconnecting on unmount:", err),
          );
      }
    };
  }, [manager]);

  useEffect(() => {
    scanForModuleRef.current = scanForModule;
  }, [scanForModule]);

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
    updateProfile,
    refreshConnection,
  };

  return (
    <BleConnectionContext.Provider value={value}>
      {children}
    </BleConnectionContext.Provider>
  );
};
