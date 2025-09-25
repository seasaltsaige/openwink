import WifiManager from "react-native-wifi-reborn";

import { DeviceMACStore, FirmwareStore } from "../../Storage";
import { UPDATE_URL } from "../Constants";
import { generatePassword } from "../Functions";
import Toast from "react-native-toast-message";

type FirmwareType = `${number}.${number}.${number}`;

export abstract class OTA {
  public static activeVersion: FirmwareType = "1.0.0";
  public static latestVersion: FirmwareType = "1.0.0";
  private static readonly wifiSSID: string = "Wink Module: Update Access Point";
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

      console.log("Downloaded firmware blob.");
      console.log(blobWithType.size);

      // await WifiManager.connectToProtectedSSID(
      //   "Wink Module: Update Access Point",
      //   this.wifiPasskey,
      //   // false,
      //   // false
      // );

      console.log("CONNECTING TO WIFI AP");
      await WifiManager.connectToProtectedWifiSSID({
        password: this.wifiPasskey,
        ssid: this.wifiSSID,
      });

      console.log("POSTING FIRMWARE");
      const updateStatusResponse = await fetch("http://module-update.local/update",
        {
          method: "POST",
          body: blobWithType,
          headers: {
            "Content-Length": blobWithType.size.toString(),
          },
        },
      );
      console.log("FINISHED");

      console.log(updateStatusResponse.headers, "HEADERS");
      console.log(updateStatusResponse.status, "STATUS");


      await WifiManager.disconnectFromSSID("Wink Module: Update Access Point");
      Toast.hide();

      if (updateStatusResponse.ok) {
        // Update successful
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