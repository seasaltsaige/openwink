import { UPDATE_URL } from "../Constants";

export abstract class OTA {
  public static activeVersion: string = "1.0.0";
  public static latestVersion: string = "1.0.0";

  public static async fetchUpdateVersion(authorization: string): boolean {
    const response = await fetch(UPDATE_URL,
      {
        method: "GET",
        headers: {
          authorization,
        },
      }
    );

    if (!response.ok) return false;

    const json = await response.json();
    const version = json["version"] as string;


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