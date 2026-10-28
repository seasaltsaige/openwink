import { FirmwareStore } from "../../Storage";
import { OTA_ACK_WINDOW_SIZE, OTA_API_KEY, UPDATE_URL } from "../Constants";

export type FirmwareType = `${number}.${number}.${number}`;

export type AvailableUpdate = {
  version: FirmwareType;
  size: number;
  app_version: FirmwareType;
  description: string;
};

export type AppUpdateInfo = {
  version: FirmwareType;
  runtimeVersion: string;
  minFirmwareVersion?: FirmwareType | null;
  requiresStoreUpdate?: boolean;
  iosStoreUrl?: string;
  androidStoreUrl?: string;
  description: string;
  createdAt: string;
};

type FetchResponse = {
  message?: string;
  updateNeeded: boolean;
  versions?: Array<AvailableUpdate>;
};

export abstract class OTA {
  public static activeVersion: FirmwareType = "1.0.0";
  public static latestVersion: FirmwareType = "1.0.0";

  public static updates: AvailableUpdate[] = [];
  public static restartQueued: boolean = false;

  private static updateInProgress: boolean = false;

  public static get updateCount(): number {
    return this.updates.length;
  }

  public static reset(): void {
    this.updateInProgress = false;
    this.updates = [];
    this.restartQueued = false;
    this.setActiveVersion();
  }

  public static async fetchUpdateAvailable(): Promise<boolean> {

    this.setActiveVersion();
    this.setLatestVersion(this.activeVersion);
    // Fetch latest software version from API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {

      // fetch update information based on current firmware version on device
      const response = await fetch(`${UPDATE_URL}/${this.latestVersion}`,
        {
          method: "GET",
          headers: {
            authorization: OTA_API_KEY,
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch update information: ${response.status} ${response.statusText}`);
      }

      // parse response into expected json format
      const json = await response.json() as FetchResponse;

      if (!json.updateNeeded || !json.versions || json.versions.length === 0) {
        this.updates = [];
        return false;
      }

      this.updates = json.versions.map(v => ({
        version: v.version,
        app_version: v.app_version,
        description: v.description,
        size: v.size,
      }));

      return true;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Update check timed out. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  public static async fetchAppUpdateInfo(runtimeVersion: string): Promise<AppUpdateInfo | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `${UPDATE_URL}/app/info?runtimeVersion=${encodeURIComponent(runtimeVersion)}`,
        {
          method: "GET",
          headers: {
            authorization: OTA_API_KEY,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch app update info: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as AppUpdateInfo;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("App update check timed out. Please check your internet connection and try again.");
      }

      throw error;
    }
  }

  public static async updateFirmware(
    updateVersion: string,
    chunkSize: number,
    startOTAService: (otaSize: number) => Promise<boolean>,
    sendOTAChunk: (chunk: Uint8Array<ArrayBufferLike>, withResponse?: boolean) => Promise<boolean>,
    sendOTAComplete: () => Promise<void>,
  ) {
    try {
      this.setLatestVersion(updateVersion as FirmwareType);
      const firmwareResponse = await fetch(`${UPDATE_URL}/firmware/${updateVersion}`,
        {
          method: "GET",
          headers: {
            authorization: OTA_API_KEY,
          }
        }
      );

      if (!firmwareResponse.ok) return false;

      const firmwareBlob = await firmwareResponse.blob();
      const uint8buffer = await this.blobToUint8Array(firmwareBlob);
      const blobChunks: Uint8Array[] = [];

      for (let i = 0; i < uint8buffer.length; i += chunkSize) {
        blobChunks.push(uint8buffer.slice(i, i + chunkSize));
      }
      const start = Date.now();
      console.log("[DEBUG] OTA START");
      this.updateInProgress = true;

      const started = await startOTAService(uint8buffer.length);
      if (!started) {
        this.updateInProgress = false;
        return false;
      }

      // Stream chunks with windowed ACK every OTA_ACK_WINDOW_SIZE chunks (and on the final chunk)
      for (let i = 0; i < blobChunks.length; i++) {
        if (!this.updateInProgress) {
          return false;
        }
        const ackChunk = ((i + 1) % OTA_ACK_WINDOW_SIZE === 0) || (i === blobChunks.length - 1);
        const ok = await sendOTAChunk(blobChunks[i], ackChunk);
        if (!ok) {
          this.updateInProgress = false;
          return false;
        }
      }

      // Check after chunks finish
      if (!this.updateInProgress) {
        return false;
      }
      await sendOTAComplete();

      const end = Date.now();
      console.log(`[DEBUG] OTA END: ${(end - start) / 1000} seconds`);

      return true;
    } catch (err) {
      this.updateInProgress = false;
      return false;
    }

  }

  public static nextUpdate() {
    if (this.updates.length >= 1) {
      this.updates.shift();
    }
  }


  // public static getUpdateSize(): number {
  //   return this.updateSizeBytes;
  // }


  public static updateVersion(): void {
    this.activeVersion = this.latestVersion;
    FirmwareStore.setFirmwareVersion(this.latestVersion);
  }

  // If an error occurs, the OTA class should
  // halt the in progress update.
  public static cancelUpdate(): void {
    this.updateInProgress = false;
  }
  public static getUpdateInProgress(): boolean {
    return this.updateInProgress;
  }

  // React Native does not implement Blob#arrayBuffer for some reason... don't ask me
  private static async blobToUint8Array(blob: Blob) {
    return new Promise<Uint8Array>((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = (ev: ProgressEvent<FileReader>) => {
        res(new Uint8Array(reader.result as ArrayBuffer));
      }
      reader.onerror = rej;
      reader.readAsArrayBuffer(blob);
    })
  }

  private static setActiveVersion() {
    const storedFirmwareVersion = FirmwareStore.getFirmwareVersion();
    if (storedFirmwareVersion !== null) this.activeVersion = storedFirmwareVersion as FirmwareType;
  }

  private static setLatestVersion(version: FirmwareType) {
    this.latestVersion = version;
  }

  private static shouldUpdate(): boolean {
    const partsLatest = this.latestVersion.split(".");
    const partsActive = this.activeVersion.split(".");

    for (let i = 0; i < partsActive.length; i++) {
      if (parseInt(partsActive[i]) < parseInt(partsLatest[i])) return true;
    }

    return false;
  }

}