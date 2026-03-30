import Storage from "./Storage";

export abstract class DeviceUUIDStore {
  static get() {
    return Storage.getString("device-uuid");
  }

  static set(uuid: string) {
    Storage.set("device-uuid", uuid);
  }

  static forgetUUID() {
    Storage.delete("device-uuid");  
  }
}