import WifiManager from "react-native-wifi-reborn";

import { DeviceMACStore, FirmwareStore } from "../../Storage";
import { UPDATE_URL } from "../Constants";
import { generatePassword } from "../Functions";

type FirmwareType = `${number}.${number}.${number}`;

export abstract class OTA {
  public static activeVersion: FirmwareType = "1.0.0";
  public static latestVersion: FirmwareType = "1.0.0";
  private static wifiPasskey: string;

  public static async fetchUpdateAvailable(): Promise<boolean> {
    // Fetch latest software version from API using device MAC address as access code
    const response = await fetch(UPDATE_URL,
      {
        method: "GET",
        headers: {
          authorization: DeviceMACStore.getStoredMAC() ?? "",
        },
      }
    );

    if (!response.ok) return false;

    const json = await response.json();
    const version = json["version"] as FirmwareType;
    this.setLatestVersion(version);
    this.setActiveVersion();

    return this.shouldUpdate();
  }

  public static generateWifiPasskey() {
    this.wifiPasskey = generatePassword(15);
    return this.wifiPasskey;
  }

  public static async updateFirmware() {
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

    console.log("Downloaded firmware blob.");
    console.log(blobWithType.size);

    await WifiManager.connectToProtectedSSIDOnce(
      "Wink Module: Update Access Point",
      this.wifiPasskey,
      false,
      true,
    );


    const updateStatusResponse = await fetch("http://module-update.local/update",
      {
        method: "POST",
        body: blobWithType,
        headers: {
          "Content-Length": blobWithType.size.toString(),
        },
      },
    );

    if (updateStatusResponse.ok) {

    }

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