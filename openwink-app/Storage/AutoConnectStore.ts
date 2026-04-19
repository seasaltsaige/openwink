import Storage from "./Storage";
const AUTO_CONNECT_KEY = "auto-reconnect-setting";
export abstract class AutoConnectStore {

  static disable(): void {
    Storage.delete(AUTO_CONNECT_KEY);
  }

  static enable(): void {
    Storage.set(AUTO_CONNECT_KEY, 1);
  }

  static get(): boolean {
    const value = Storage.getNumber(AUTO_CONNECT_KEY);
    if (value === undefined) return false;
    else return true;
  }

  static set(value: boolean): void {
    if (value) this.disable(); 
    else this.enable();
  }

}