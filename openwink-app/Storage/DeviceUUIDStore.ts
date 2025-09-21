import Storage from "./Storage";

export abstract class DeviceUUIDStore {
  static async get() {
    return Storage.getString("device-uuid");
  }
}