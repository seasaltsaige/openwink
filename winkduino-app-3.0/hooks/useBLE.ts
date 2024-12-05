
import { useEffect, useState, useMemo } from "react";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, ScanCallbackType, ScanMode, Subscription } from "react-native-ble-plx";

import {
    DeviceMACStore,
    AutoConnectStore
} from "../Storage";

import {
    BUSY_CHAR_UUID,
    FIRMWARE_UUID,
    LEFT_STATUS_UUID,
    RIGHT_STATUS_UUID,
    SCAN_TIME_SECONDS,
    SERVICE_UUID,
    SOFTWARE_STATUS_UUID,
    SOFTWARE_UPDATING_UUID,
} from "../helper/Constants";

function useBLE() {

    // Main BLE state Manager
    const manager = useMemo(() => new BleManager(), []);

    // Connected device
    const [device, setDevice] = useState<Device | null>(null);

    // Monitored characteristic values
    const [headlightsBusy, setHeadlightsBusy] = useState(false);
    const [leftStatus, setLeftStatus] = useState(0);
    const [rightStatus, setRightStatus] = useState(0);

    const [mac, setMac] = useState("");
    const [firmwareVersion, setFirmwareVersion] = useState("");

    const [updateProgress, setUpdateProgress] = useState(0);
    const [updatingStatus, setUpdatingStatus] = useState<"Idle" | "Updating" | "Failed" | "Success">("Idle");

    // Home page scanning status
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Delay between when headlights start moving during a wave command
    // const [waveDelay]


    useEffect(() => {
        (async () => {
            const macAddr = await DeviceMACStore.getStoredMAC();
            if (macAddr) setMac(macAddr);
            // TODO: Error handler. Should give warnings for errors with asyncstore
            else { }
        })();

        return () => { }
    }, []);



    const requestAndroid31Permissions = async () => {
        const bluetoothScanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK"
            }
        );

        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
            }
        );

        return (
            bluetoothScanPermission === "granted" &&
            bluetoothConnectPermission === "granted" &&
            fineLocationPermission === "granted"
        );
    };

    const requestPermissions = async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "This app requires Location Services to function correctly.",
                        buttonPositive: "OK",
                    }
                );
                return (granted === PermissionsAndroid.RESULTS.GRANTED);

            } else return await requestAndroid31Permissions();
        } else return true;
    }



    return {
        requestPermissions,


    }

}