import Storage from "./Storage";

const MOCK_BLE_KEY = "dev-mock-ble-enabled";
const MOCK_BLE_STATE_KEY = "dev-mock-ble-state";

export interface MockBleState {
  characteristicValues: Record<string, string>;
  customButtonPressArray: number[];
  maxTimeBetween_ms: number;
  customButtonStatusEnabled: boolean;
}

export abstract class MockBleStore {

  static enable(): void {
    Storage.set(MOCK_BLE_KEY, true);
  }

  static disable(): void {
    Storage.delete(MOCK_BLE_KEY);
  }

  static get(): boolean {
    const value = Storage.getBoolean(MOCK_BLE_KEY);
    return value ?? false;
  }

  static set(value: boolean): void {
    if (value) this.enable();
    else this.disable();
  }

  // State persistence methods
  static saveState(state: MockBleState): void {
    try {
      Storage.set(MOCK_BLE_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save mock BLE state:', error);
    }
  }

  static loadState(): MockBleState | null {
    try {
      const stateJson = Storage.getString(MOCK_BLE_STATE_KEY);
      if (stateJson) {
        return JSON.parse(stateJson);
      }
    } catch (error) {
      console.error('Failed to load mock BLE state:', error);
    }
    return null;
  }

  static clearState(): void {
    Storage.delete(MOCK_BLE_STATE_KEY);
  }

}
