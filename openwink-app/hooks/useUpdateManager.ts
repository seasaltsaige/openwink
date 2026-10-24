import { useCallback, useEffect, useState } from "react";

import { ATT_HEADER_SIZE } from "../helper/Constants";
import { sleep } from "../helper/Functions";
import { OTA } from "../helper/Handlers/OTA";
import { useBleConnection } from "../Providers/BleConnectionProvider";
import { useOtaUpdate } from "../Providers/OTAUpdateProvider";
import { useBleMonitor } from "../Providers/BleMonitorProvider";
import { UpdatingStatus } from "../helper/Types";

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

export type UpdateData = {
  version: string;
  app_version: string;
  description: string;
  size: number;
};

type UpdateManagerReturnType = {
  updateStatus: UPDATE_STATUS;
  updateData: UpdateData[] | null;
  error: ERROR_TYPE;
  startUpdate: (version: string) => Promise<void>;
  checkUpdateAvailable: () => Promise<boolean>;
};

export const useUpdateManager = (): UpdateManagerReturnType => {
  const { sendOTAChunk, sendOTAComplete, startOTAService } =
    useOtaUpdate();

  const { isConnected, device } = useBleConnection();
  const { updatingStatus } = useBleMonitor();

  const [updateStatus, setUpdateStatus] = useState(UPDATE_STATUS.IDLE);
  const [error, setError] = useState(ERROR_TYPE.ERR_NONE);
  const [updateData, setUpdateData] = useState(null as UpdateData[] | null);

  useEffect(() => {
    if (!isConnected) return setUpdateStatus(UPDATE_STATUS.IDLE);

    // if new status is "Updating", set current status to installing
    if (updatingStatus === UpdatingStatus.UPDATING)
      setUpdateStatus(UPDATE_STATUS.INSTALLING);
    // if new status is "Success", set current status to up to date
    else if (updatingStatus === UpdatingStatus.SUCCESS) {
      setUpdateStatus(UPDATE_STATUS.UP_TO_DATE);
      OTA.restartQueued = true;
    }
    // if previous status is "Installing"
    else if (updateStatus === UPDATE_STATUS.INSTALLING) {
      // and new status is some error
      if (
        updatingStatus === UpdatingStatus.ERROR_FLASH_INIT ||
        updatingStatus === UpdatingStatus.ERROR_INVALID_SIZE ||
        updatingStatus === UpdatingStatus.ERROR_VERIFICATION_INIT ||
        updatingStatus === UpdatingStatus.ERROR_VERIFICATION_SIGN ||
        updatingStatus === UpdatingStatus.ERROR_CHUNK_WRITE
      ) {
        // set the current status to available update, as an error happened
        // while installing
        setUpdateStatus(UPDATE_STATUS.AVAILABLE);
        setError(ERROR_TYPE.ERR_UPDATE_FAILED);
      }
    }
  }, [updatingStatus, updateStatus, isConnected]);

  const startUpdate = useCallback(
    async (version: string) => {
      if (!isConnected) return;
      setUpdateStatus(UPDATE_STATUS.INSTALLING);
      setError(ERROR_TYPE.ERR_NONE);

      const chunkSize = Math.max(20, (device?.mtu ?? 185) - ATT_HEADER_SIZE);

      const success = await OTA.updateFirmware(
        version,
        chunkSize,
        startOTAService,
        sendOTAChunk,
        sendOTAComplete,
      );

      if (!success) {
        setUpdateStatus(UPDATE_STATUS.AVAILABLE);
        setError(ERROR_TYPE.ERR_UPDATE_FAILED);
        setTimeout(() => setError(ERROR_TYPE.ERR_NONE), 7500);
      }
    },
    [isConnected, device?.mtu, startOTAService, sendOTAChunk, sendOTAComplete],
  );

  const checkUpdateAvailable = useCallback(async () => {
    if (!isConnected) {
      setUpdateStatus(UPDATE_STATUS.IDLE);
      setError(ERROR_TYPE.ERR_DISCONNECT);
      return false;
    }
    try {
      setUpdateStatus(UPDATE_STATUS.FETCHING);
      setError(ERROR_TYPE.ERR_NONE);

      // simulated delay cause it looks bad without it lol
      await sleep(Math.floor(Math.random() * 1100) + 500);

      const available = await OTA.fetchUpdateAvailable();

      if (!available) {
        setUpdateStatus(UPDATE_STATUS.UP_TO_DATE);
        return false;
      }

      setUpdateData([...OTA.updates]);
      setUpdateStatus(UPDATE_STATUS.AVAILABLE);

      return true;
    } catch (err) {
      setError(ERROR_TYPE.ERR_TIMEOUT);
      setUpdateStatus(UPDATE_STATUS.IDLE);

      setTimeout(() => setError(ERROR_TYPE.ERR_NONE), 7500);
      return false;
    }
  }, [isConnected]);

  return {
    updateStatus,
    error,
    updateData,
    checkUpdateAvailable,
    startUpdate,
  };
};
