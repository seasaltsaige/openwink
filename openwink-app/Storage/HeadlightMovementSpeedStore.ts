import Storage from "./Storage";

export enum SIDE {
  LEFT,
  RIGHT,
}
const MOVEMENT_STORE_KEY = "movement-key";

export abstract class HeadlightMovementSpeedStore {
  private static makeKey(side: SIDE) {
    return `${MOVEMENT_STORE_KEY}-${side == SIDE.LEFT ? "left" : "right"}`;
  }

  static setMotionValue(side: SIDE, value: number) {
    Storage.set(this.makeKey(side), value);
  }

  static getMotionValue(side: SIDE) {
    const value = Storage.getNumber(this.makeKey(side));
    return value || 625;
  }
}