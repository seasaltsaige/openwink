import * as Updates from "expo-updates";
import { OTA_API_KEY, UPDATE_URL } from "../Constants";
import { compareVersions, getRunningAppVersion } from "../Functions";
import { FirmwareType } from "./OTA";

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

export abstract class AppOTA {
  public static latestUpdateInfo: AppUpdateInfo | null = null;

  public static async fetchUpdateInfo(
    runtimeVersion: string
  ): Promise<AppUpdateInfo | null> {
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
        throw new Error(
          `Failed to fetch app update info: ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as AppUpdateInfo;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "App update check timed out. Please check your internet connection and try again."
        );
      }

      throw error;
    }
  }

  public static async fetchUpdateAvailable(): Promise<boolean> {
    const runtimeVersion = Updates.runtimeVersion || "2.0.0";

    // First check /app/info so a new native App Store / Play Store build preempts OTA updates
    const info = await this.fetchUpdateInfo(runtimeVersion).catch(() => null);
    if (
      info &&
      (info.requiresStoreUpdate ||
        (info.runtimeVersion &&
          compareVersions(info.runtimeVersion, runtimeVersion) > 0))
    ) {
      this.latestUpdateInfo = {
        ...info,
        requiresStoreUpdate: true,
      };
      return true;
    }

    if (Updates.isEnabled && !__DEV__) {
      const updateCheck = await Updates.checkForUpdateAsync();

      if (!updateCheck.isAvailable) {
        this.latestUpdateInfo = null;
        return false;
      }

      const manifestMeta = (
        updateCheck.manifest as Record<string, any> | undefined
      )?.metadata;
      this.latestUpdateInfo = info ?? {
        version: (manifestMeta?.appVersion ?? runtimeVersion) as FirmwareType,
        runtimeVersion,
        minFirmwareVersion: manifestMeta?.minFirmwareVersion ?? null,
        requiresStoreUpdate: false,
        description: "Bug fixes and improvements.",
        createdAt: new Date().toISOString(),
      };
      return true;
    } else {
      // In development mode, check /app/info against current version for UI testing
      if (!info || compareVersions(info.version, getRunningAppVersion()) <= 0) {
        this.latestUpdateInfo = null;
        return false;
      }

      this.latestUpdateInfo = info;
      return true;
    }
  }

  public static async installUpdate(): Promise<boolean> {
    if (!Updates.isEnabled || __DEV__) {
      throw new Error("App OTA updates can only be installed in release builds.");
    }

    const result = await Updates.fetchUpdateAsync();
    if (!result.isNew) {
      return false;
    }

    await Updates.reloadAsync();
    return true;
  }
}
