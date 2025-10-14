import { useCallback, useEffect, useState } from "react";
import { OTA } from "../helper/Handlers/OTA"
import { useOtaUpdate } from "../Providers/OTAUpdateProvider";
import { useBleConnection } from "../Providers/BleConnectionProvider";
import { sleep } from "../helper/Functions";
import { useBleMonitor } from "../Providers/BleMonitorProvider";

export enum UPDATE_STATUS {
  IDLE,
  FETCHING,
  AVAILABLE,
  INSTALLING,
  UP_TO_DATE,
}

export enum ERROR_TYPE {
  ERR_NONE,
  ERR_TIMEOUT,
  ERR_UPDATE_FAILED,
  ERR_UPDATE_HALTED,
  ERR_DISCONNECT,
}

type UpdateData = {
  version: string;
  description: string;
  size: number;
}

type UpdateManagerType = {
  onSuccess: ({

  }) => void;

  onError: ({
    errorType,
    errorMessage,
    errorTitle,
  }: {
    errorType: ERROR_TYPE;
    errorMessage: string;
    errorTitle: string;
  }) => void;
}

type UpdateManagerReturnType = {
  updateStatus: UPDATE_STATUS;
  updateData: UpdateData | null;
  error: ERROR_TYPE;
  startUpdate: () => Promise<void>;
  stopUpdate: () => Promise<void>;
  checkUpdateAvailable: () => Promise<void>;
}

const OTA_HEADER_SIZE = 5;

export const useUpdateManager = ({
  onError,
  onSuccess,
}: UpdateManagerType): UpdateManagerReturnType => {

  const {
    haltOTAUpdate,
    sendOTAChunk,
    sendOTAComplete,
    sendOTASize,
    startOTAService
  } = useOtaUpdate();

  const { device } = useBleConnection();

  const [updateStatus, setUpdateStatus] = useState(UPDATE_STATUS.IDLE);
  const [error, setError] = useState(ERROR_TYPE.ERR_NONE);
  const [updateData, setUpdateData] = useState(null as UpdateData | null);


  const startUpdate = useCallback(
    async () => {
      if (!device) return;
      setUpdateStatus(UPDATE_STATUS.INSTALLING);
      setError(ERROR_TYPE.ERR_NONE);

      await startOTAService();
      await sleep(50);
      const updateSuccessStatus = await OTA.updateFirmware(
        device.mtu - OTA_HEADER_SIZE,
        sendOTAChunk,
        sendOTASize,
        sendOTAComplete,
      );

      if (updateSuccessStatus) {
        setError(ERROR_TYPE.ERR_NONE);
        setUpdateStatus(UPDATE_STATUS.UP_TO_DATE);
      } else {
        // If update goes wrong, reset and check for update again.
        // Additionally check to make sure update was not halted
        if (error !== ERROR_TYPE.ERR_UPDATE_HALTED) {
          // error does not update while in function. Would need ref def to achieve this
          setError(ERROR_TYPE.ERR_UPDATE_FAILED);
          setUpdateStatus(UPDATE_STATUS.IDLE);
          setTimeout(() => setError(ERROR_TYPE.ERR_NONE), 7500);
        }
      }

    },
    [device],
  );

  const checkUpdateAvailable = useCallback(
    async () => {
      if (!device) {
        setUpdateStatus(UPDATE_STATUS.IDLE);
        setError(ERROR_TYPE.ERR_DISCONNECT);
      };
      try {
        setUpdateStatus(UPDATE_STATUS.FETCHING);
        setError(ERROR_TYPE.ERR_NONE);

        // simulated delay cause it looks bad without it lol
        await sleep(1100);

        const available = await OTA.fetchUpdateAvailable();

        if (!available) return setUpdateStatus(UPDATE_STATUS.UP_TO_DATE);

        const updateInfo: UpdateData = {
          description: OTA.updateDescription,
          size: OTA.getUpdateSize(),
          version: OTA.latestVersion,
        }

        setUpdateData(() => (updateInfo));
        setUpdateStatus(UPDATE_STATUS.AVAILABLE);

      } catch (err) {
        setError(ERROR_TYPE.ERR_TIMEOUT);
        setUpdateStatus(UPDATE_STATUS.IDLE);
        setTimeout(() => setError(ERROR_TYPE.ERR_NONE), 7500);
      }
    },
    [device],
  );

  const stopUpdate = useCallback(
    async () => {
      if (!device) return;
      await haltOTAUpdate();
      setError(ERROR_TYPE.ERR_UPDATE_HALTED);
      setTimeout(() => setError(ERROR_TYPE.ERR_NONE), 7500);
      setUpdateStatus(UPDATE_STATUS.IDLE);
    },
    [device],
  );

  return {
    updateStatus,
    error,
    updateData,
    checkUpdateAvailable,
    startUpdate,
    stopUpdate,
  }
}