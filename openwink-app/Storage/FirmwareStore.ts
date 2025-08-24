import Storage from "./Storage";
const VERSION_KEY = "firmware-version";

export abstract class FirmwareStore {
  static setFirmwareVersion(firmware: string): void {
    Storage.set(VERSION_KEY, firmware);
  }

  static forgetFirmwareVersion(): void {
    Storage.delete(VERSION_KEY);
  }

  static getFirmwareVersion(): string | null {
    const version = Storage.getString(VERSION_KEY);
    if (!version) return null;
    else return version;
  }
}