import Storage from "./Storage"

const ORIENTATION_KEY = "headlight-orientation"
export enum ORIENTATION {
  CABIN,
  OUTSIDE,
}

export abstract class HeadlightOrientationStore {

  // By default will return Cabin orientation
  static getStatus(): ORIENTATION {
    if (Storage.getBoolean(ORIENTATION_KEY)) return ORIENTATION.CABIN;
    else return ORIENTATION.OUTSIDE;
  }

  static toggle() {
    if (Storage.getBoolean(ORIENTATION_KEY)) HeadlightOrientationStore.disable();
    else HeadlightOrientationStore.enable();
  }

  static disable() {
    Storage.delete(ORIENTATION_KEY);
  }

  static enable() {
    Storage.set(ORIENTATION_KEY, true);
  }

}