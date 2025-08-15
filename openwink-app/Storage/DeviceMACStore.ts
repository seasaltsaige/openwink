import Storage from ".";
const MAC_ADDR_KEY = "mac-addr";

export abstract class DeviceMACStore {
  static getStoredMAC(): string | null {
    const mac = Storage.getString(MAC_ADDR_KEY);
    if (!mac) return null;
    else return mac;

  }

  static setMAC(mac: string): void {
    Storage.set(MAC_ADDR_KEY, mac);
  }

  static forgetMAC(): void {
    Storage.delete(MAC_ADDR_KEY);
  }
}