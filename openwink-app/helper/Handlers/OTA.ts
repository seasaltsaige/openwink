import { DeviceMACStore, FirmwareStore } from "../../Storage";
import { jkYSbsSAIDns, UPDATE_URL } from "../Constants";
import { sleep } from "../Functions";

type FirmwareType = `${number}.${number}.${number}`;
type FetchResponse = {
  message?: string;
  updateNeeded: boolean;

  versions?: Array<{
    version: FirmwareType;
    size: number;
    app_version: FirmwareType;
    description: string;
  }>
}

export abstract class OTA {
  public static activeVersion: FirmwareType = "1.0.0";
  public static latestVersion: FirmwareType = "1.0.0";

  public static updateCount: number = 0;
  // public static currentCount: number = 0;
  public static updateSizesBytes: number[] = [];
  public static updateDescriptions: string[] = [];
  public static updateFirmwareVersions: FirmwareType[] = [];
  public static updateAppVersions: FirmwareType[] = [];

  public static restartQueued: boolean = false;

  private static updateInProgress: boolean = false;

  public static reset(): void {
    this.updateInProgress = false;
    this.updateCount = 0;
    this.updateSizesBytes = [];
    this.updateDescriptions = [];
    this.updateFirmwareVersions = [];
    this.updateAppVersions = [];
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
            authorization: jkYSbsSAIDns,
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

      if (!json.updateNeeded) return false;

      this.updateAppVersions = json.versions?.map(v => v.app_version)!;
      this.updateFirmwareVersions = json.versions?.map(v => v.version)!;
      this.updateSizesBytes = json.versions?.map(v => v.size)!;
      this.updateDescriptions = json.versions?.map(v => v.description)!;
      this.updateCount = json.versions?.length!;

      return json.updateNeeded;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Update check timed out. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  public static async updateFirmware(
    updateVersion: string,
    mtu: number,
    sendOTAChunk: (chunk: Uint8Array<ArrayBufferLike>) => Promise<boolean>,
    sendOTASize: (otaSize: number) => Promise<void>,
    sendOTAComplete: () => Promise<void>,
  ) {
    try {
      const firmwareResponse = await fetch(`${UPDATE_URL}/firmware/${updateVersion}`,
        {
          method: "GET",
          headers: {
            authorization: jkYSbsSAIDns,
          }
        }
      );

      if (!firmwareResponse.ok) return false;

      const firmwareBlob = await firmwareResponse.blob();
      const uint8buffer = await this.blobToUint8Array(firmwareBlob);
      const blobChunks: Uint8Array[] = [];

      for (let i = 0; i < uint8buffer.length; i += mtu) {
        blobChunks.push(uint8buffer.slice(i, i + mtu));
      }
      const start = Date.now();
      console.log("[DEBUG] OTA START");
      this.updateInProgress = true;

      await sendOTASize(firmwareBlob.size);
      await sleep(25);

      // Check if update still valid before sending chunks
      for (const chunk of blobChunks) {
        // Before each chunk
        if (!this.updateInProgress) {
          return false;
        }
        await sendOTAChunk(chunk);
      }

      // wtf lol
      // pretty sure that w/ the signed key
      // and using writeCharacteristicWithoutResponse
      // the OTA update handler on the ESP checks the bin
      // against the public key before the bin file is done
      // transferring.
      // using WithResponse is WAYYYY too slow, soo....
      // just wait a bit i guess... 
      // seems to work ??????
      await sleep(750);

      // Check after chunks finish
      if (!this.updateInProgress) {
        return false;
      }
      await sendOTAComplete();



      const end = Date.now();
      console.log(`[DEBUG] OTA END: ${(end - start) / 1000} seconds`);

      // this.activeVersion = this.latestVersion;

      return true;
    } catch (err) {
      return false;
    }

  }

  public static nextUpdate() {
    if (this.updateFirmwareVersions.length >= 1) {
      this.updateSizesBytes.shift();
      this.updateDescriptions.shift();
      this.updateFirmwareVersions.shift();
      this.updateAppVersions.shift();
    }
  }


  // public static getUpdateSize(): number {
  //   return this.updateSizeBytes;
  // }


  public static updateVersion(): void {
    this.activeVersion = this.latestVersion;
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