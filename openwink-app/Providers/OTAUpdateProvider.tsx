import { createContext, useCallback, useContext } from "react";
import { useBleConnection } from "./BleConnectionProvider";
import { ATT_HEADER_SIZE, getBLEDescriptors, OTAControlCommand } from "../helper/Constants";
import { bytesToBase64, sleep } from "../helper/Functions";
import { useBleMonitor } from "./BleMonitorProvider";

type OTAUpdateContextType = {
  startOTAService: (otaSize: number) => Promise<boolean>;
  haltOTAUpdate: () => Promise<void>;
  sendOTAChunk: (chunk: Uint8Array, withResponse?: boolean) => Promise<boolean>;
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
  const { updatingStatus } = useBleMonitor();

  // Start OTA firmware update service with atomic [OTA_CTRL_START, size_le_u32] packet
  const startOTAService = useCallback(
    async (otaSize: number): Promise<boolean> => {
      if (!device) {
        console.warn('No device connected');
        return false;
      }

      try {
        const startPacket = [
          OTAControlCommand.START,
          otaSize & 0xFF,
          (otaSize >>> 8) & 0xFF,
          (otaSize >>> 16) & 0xFF,
          (otaSize >>> 24) & 0xFF,
        ];

        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
          bytesToBase64(startPacket),
        );

        console.log("Started OTA service, size:", otaSize);
        await sleep(50);
        return true;
      } catch (error) {
        console.error('Error starting OTA service:', error);
        return false;
      }
    },
    [device]
  );

  // Halt update early if canceled
  const haltOTAUpdate = useCallback(
    async () => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
          bytesToBase64([OTAControlCommand.HALT]),
        );

        console.log("Halting OTA service");
      } catch (error) {
        console.error('Error stopping OTA service:', error);
      }
    },
    [device],
  );

  const sendOTAChunk = useCallback(
    async (chunk: Uint8Array, withResponse = false) => {
      if (chunk.length < 1) return false;
      if (!device || !device.mtu) return false;

      const maxPayload = Math.max(20, device.mtu - ATT_HEADER_SIZE);

      try {
        if (chunk.length > maxPayload) {
          const chunks: Uint8Array[] = [];
          for (let i = 0; i < chunk.length; i += maxPayload) {
            chunks.push(chunk.slice(i, i + maxPayload));
          }

          for (let i = 0; i < chunks.length; i++) {
            const parsedDataChunk = bytesToBase64(chunks[i]);
            const isLastSubChunk = i === chunks.length - 1;
            if (withResponse && isLastSubChunk) {
              await device.writeCharacteristicWithResponseForService(
                ...getBLEDescriptors("OTA", "OTA_COMMAND"),
                parsedDataChunk,
              );
            } else {
              await device.writeCharacteristicWithoutResponseForService(
                ...getBLEDescriptors("OTA", "OTA_COMMAND"),
                parsedDataChunk,
              );
            }
          }
        } else {
          const parsedChunk = bytesToBase64(chunk);
          if (withResponse) {
            await device.writeCharacteristicWithResponseForService(
              ...getBLEDescriptors("OTA", "OTA_COMMAND"),
              parsedChunk,
            );
          } else {
            await device.writeCharacteristicWithoutResponseForService(
              ...getBLEDescriptors("OTA", "OTA_COMMAND"),
              parsedChunk,
            );
          }
        }
        return true;
      } catch (error) {
        console.error('Error sending OTA chunk:', error);
        await haltOTAUpdate();
        return false;
      }
    },
    [device, updatingStatus, haltOTAUpdate],
  );

  const sendOTAComplete = useCallback(
    async () => {
      if (!device) {
        console.warn('No device connected');
        return;
      }

      try {
        await device.writeCharacteristicWithResponseForService(
          ...getBLEDescriptors("OTA", "SOFTWARE_STATUS"),
          bytesToBase64([OTAControlCommand.DONE]),
        );

        console.log("Sending OTA DONE");
      } catch (err) {
        console.error("Failed to send finalize OTA Update Command:", err);
      }
    },
    [device],
  );

  const value: OTAUpdateContextType = {
    startOTAService,
    haltOTAUpdate,
    sendOTAChunk,
    sendOTAComplete,
  }

  return <OTAUpdateContext.Provider value={value}>{children}</OTAUpdateContext.Provider>
}