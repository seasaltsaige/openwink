import { getDeviceUUID } from "../helper/Functions";
import Storage from "./Storage";

export abstract class DeviceUUIDStore {
  static async get() {
    return Storage.getString("device-uuid");
  }
  static async reset() {
    Storage.delete("device-uuid");
    getDeviceUUID();
  }
}