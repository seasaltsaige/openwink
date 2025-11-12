import { DeviceMACStore, FirmwareStore } from "../../Storage";
import { UPDATE_URL } from "../Constants";
import { sleep } from "../Functions";

type FirmwareType = `${number}.${number}.${number}`;

export abstract class OTA {
  public static activeVersion: FirmwareType = "1.0.0";
  public static latestVersion: FirmwareType = "1.0.0";
  public static updateDescription: string = "";
  private static updateSizeBytes: number = 0;
  // private static written: number = 0;

  public static async fetchUpdateAvailable(): Promise<boolean> {
    this.setActiveVersion();
    this.setLatestVersion(this.activeVersion);
    this.updateDescription = "";
    this.updateSizeBytes = 0;
    // Fetch latest software version from API using device MAC address as access code
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(UPDATE_URL,
        {
          method: "GET",
          headers: {
            authorization: DeviceMACStore.getStoredMAC() ?? "",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch update information: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const version = json["version"] as FirmwareType;
      const description = json["description"] as string;
      const size = json["size"] as number;
      this.updateDescription = description;
      this.setLatestVersion(version);
      this.setActiveVersion();
      this.updateSizeBytes = size;

      return this.shouldUpdate();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Update check timed out. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  public static async updateFirmware(
    mtu: number,
    sendOTAChunk: (chunk: Uint8Array<ArrayBufferLike>) => Promise<boolean>,
    sendOTASize: (otaSize: number) => Promise<void>,
    sendOTAComplete: () => Promise<void>,
  ) {
    try {
      const firmwareResponse = await fetch(`${UPDATE_URL}/firmware`,
        {
          method: "GET",
          headers: {
            authorization: DeviceMACStore.getStoredMAC() ?? "",
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
      await sendOTASize(firmwareBlob.size);
      await sleep(25);

      for (const chunk of blobChunks) {
        await sendOTAChunk(chunk);
      }

      await sendOTAComplete();

      const end = Date.now();
      console.log(`[DEBUG] OTA END: ${(end - start) / 1000} seconds`);

      this.activeVersion = this.latestVersion;

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }

  }


  public static getUpdateSize(): number {
    return this.updateSizeBytes;
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