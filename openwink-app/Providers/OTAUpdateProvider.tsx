import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useBleConnection } from "./BleConnectionProvider";
import { OTA_SERVICE_UUID, OTA_UUID } from "../helper/Constants";
import base64 from "react-native-base64";
import Toast from "react-native-toast-message";
import { sleep } from "../helper/Functions";

type OTAUpdateContextType = {
  startOTAService: () => Promise<void>;
  haltOTAUpdate: () => Promise<void>;
  sendOTAChunk: (chunk: Uint8Array) => Promise<boolean>;
  sendOTASize: (otaSize: number) => Promise<void>;
  sendOTAComplete: () => Promise<void>;
}

export const OTAUpdateContext = createContext<OTAUpdateContextType | null>(null);

export const useOtaUpdate = () => {
  const context = useContext(OTAUpdateContext);
  if (!context) {
    throw new Error('useOtaUpdate must be used within OTAUpdateProvider');
  }
  return context;
}

export const OTAUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const { device } = useBleConnection();
  // Used to communicate cancelation to OTA handler
  const otaUpdateInProgressRef = useRef<boolean>(false);

  const setUpdateInProgress = (value: boolean) => {
    otaUpdateInProgressRef.current = value;
  }


  // Start OTA (Over-The-Air) firmware update service
  const startOTAService = useCallback(
    async () => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (otaUpdateInProgressRef.current) {
        console.warn("OTA Update already in progress");
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          OTA_SERVICE_UUID,
          OTA_UUID,
          base64.encode("START"),
        );

        console.log("Starting OTA service");

        setUpdateInProgress(true);

        // Wait for OTA service to initialize
        await sleep(1500);

        Toast.show({
          type: 'info',
          text1: 'OTA Service Started',
          text2: 'Ready to receive firmware update.',
          visibilityTime: 3000,
        });
      } catch (error) {
        console.error('Error starting OTA service:', error);

        Toast.show({
          type: 'error',
          text1: 'OTA Failed',
          text2: 'Failed to start OTA service.',
          visibilityTime: 3000,
        });
      }
    },
    [device, otaUpdateInProgressRef]
  );

  // Halt update early if canceled
  const haltOTAUpdate = useCallback(
    async () => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (!otaUpdateInProgressRef.current) {
        console.warn("No Update in progress");
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          OTA_SERVICE_UUID,
          OTA_UUID,
          base64.encode("HALT"),
        );

        console.log("Halting OTA service");

        setUpdateInProgress(false);

        Toast.show({
          type: 'info',
          text1: 'OTA Service Cancelled',
          text2: 'Ready to receive firmware update.',
          visibilityTime: 3000,
        });
      } catch (error) {
        console.error('Error stopping OTA service:', error);

        Toast.show({
          type: 'error',
          text1: 'OTA Failed',
          text2: 'Failed to stop OTA service.',
          visibilityTime: 3000,
        });
      }

    },
    [device, otaUpdateInProgressRef],
  );

  const sendOTAChunk = useCallback(
    async (chunk: Uint8Array) => {
      if (chunk.length < 1) return false;
      if (!device || !device.mtu) return false;
      // If not in progress, send value to OTA handler
      if (!otaUpdateInProgressRef.current) return false;
      try {
        // if chunk length is for some reason larger than negotiated MTU, split it to allowed size
        if (chunk.length > device.mtu) {
          const chunks: Uint8Array[] = [];
          for (let i = 0; i < chunk.length; i += device.mtu) {
            chunks.push(chunk.slice(i, i + device.mtu));
          }

          for (const dataChunk of chunks) {
            // parse to base64 for ble-plx
            const parsedDataChunk = base64.encode(String.fromCharCode(...dataChunk));
            // send data chunk
            await device.writeCharacteristicWithResponseForService(
              OTA_SERVICE_UUID,
              OTA_UUID,
              parsedDataChunk,
            );
          }

          // chunk size is already correct, so send it over.
        } else {
          const parsedChunk = base64.encode(String.fromCharCode(...chunk));
          await device.writeCharacteristicWithResponseForService(
            OTA_SERVICE_UUID,
            OTA_UUID,
            parsedChunk,
          );
        }
        return true;
      } catch (error) {
        console.error('Error sending OTA chunk:', error);

        Toast.show({
          type: 'error',
          text1: 'OTA Failed',
          text2: 'Failed to send OTA update.',
          visibilityTime: 3000,
        });

        await haltOTAUpdate();
        return false;
      }
    },
    [device, otaUpdateInProgressRef],
  );

  const sendOTASize = useCallback(
    async (otaSize: number) => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (!otaUpdateInProgressRef.current) {
        console.warn("No Update in progress (OTA SIZE)");
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          OTA_SERVICE_UUID,
          OTA_UUID,
          base64.encode(otaSize.toString()),
        );


        console.log("Sending OTA Size: ", otaSize);
      } catch (error) {
        console.error("Failed to send OTA Size");
        await haltOTAUpdate();
      }
    },
    [device, otaUpdateInProgressRef],
  );

  const sendOTAComplete = useCallback(
    async () => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      if (!otaUpdateInProgressRef.current) {
        console.warn("No Update in progress");
        return;
      }

      try {
        await device.writeCharacteristicWithoutResponseForService(
          OTA_SERVICE_UUID,
          OTA_UUID,
          base64.encode("DONE"),
        );

        setUpdateInProgress(false);

        console.log("Sending OTA DONE");
      } catch (err) {
        console.error("Failed to send finalize OTA Update Command");
      }
    },
    [device, otaUpdateInProgressRef],
  );

  const value: OTAUpdateContextType = {
    startOTAService,
    haltOTAUpdate,
    sendOTAChunk,
    sendOTASize,
    sendOTAComplete,
  }

  return <OTAUpdateContext.Provider value={value}>{children}</OTAUpdateContext.Provider>
}