import WifiManager from "react-native-wifi-reborn";
import { DeviceMACStore, FirmwareStore } from "../../Storage";
import { UPDATE_URL } from "../Constants";
import { generatePassword } from "../Functions";

type FirmwareType = `${number}.${number}.${number}`;

export abstract class OTA {
  public static activeVersion: FirmwareType = "1.0.0";
  public static latestVersion: FirmwareType = "1.0.0";
  public static updateDescription: string = "";

  private static readonly wifiSSID: string = "Wink Module: Update Access Point";
  private static wifiPasskey: string;
  private static updateSizeBytes: number = 0;

  public static async fetchUpdateAvailable(): Promise<boolean> {
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

  public static generateWifiPasskey() {
    this.wifiPasskey = generatePassword(15);
    return this.wifiPasskey;
  }

  public static async updateFirmware() {
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
      const blobWithType = firmwareBlob.slice(0, firmwareBlob.size, "application/octet-stream");

      await WifiManager.connectToProtectedWifiSSID({
        password: this.wifiPasskey,
        ssid: this.wifiSSID,
      });

      const updateStatusResponse = await fetch("http://module-update.local/update",
        {
          method: "POST",
          body: blobWithType,
          headers: {
            "Content-Length": blobWithType.size.toString(),
          },
        },
      );

      if (updateStatusResponse.status == 200) {
        // Update successful
        FirmwareStore.setFirmwareVersion(this.latestVersion);
        this.activeVersion = this.latestVersion;
        return true;
      } else {
        // Update went wrong for some reason
        return false;
      }

    } catch (err) {
      console.log(err);
      return false;
    }

  }


  public static getUpdateSize(): number {
    return this.updateSizeBytes;
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