import Storage from "./Storage";
const AUTO_CONNECT_KEY = "auto-reconnect-setting";
export abstract class AutoConnectStore {

  static enable(): void {
    Storage.delete(AUTO_CONNECT_KEY);
  }

  static disable(): void {
    Storage.set(AUTO_CONNECT_KEY, 1);
  }

  static get(): boolean {
    const value = Storage.getNumber(AUTO_CONNECT_KEY);
    if (value === undefined) return true;
    else return false;
  }

}