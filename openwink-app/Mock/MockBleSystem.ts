import { Device, BleManager, Subscription, BleError, State, ScanOptions } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import {
  BUSY_CHAR_UUID,
  LEFT_STATUS_UUID,
  RIGHT_STATUS_UUID,
  SOFTWARE_UPDATING_CHAR_UUID,
  SOFTWARE_STATUS_CHAR_UUID,
  HEADLIGHT_MOTION_IN_UUID,
  CUSTOM_COMMAND_UUID,
  CLIENT_MAC_UUID,
  WINK_SERVICE_UUID,
  OTA_SERVICE_UUID,
  MODULE_SETTINGS_SERVICE_UUID,
  FIRMWARE_UUID,
  HEADLIGHT_CHAR_UUID,
  CUSTOM_BUTTON_UPDATE_UUID,
  HEADLIGHT_MOVEMENT_DELAY_UUID,
  SLEEPY_EYE_UUID,
  SLEEPY_SETTINGS_UUID,
  LONG_TERM_SLEEP_UUID,
  SYNC_UUID,
  UNPAIR_UUID,
  RESET_UUID,
  OTA_UUID,
  DefaultCommandValue,
  ButtonStatus,
} from '../helper/Constants';
import { MockBleStore, MockBleState } from '../Storage/MockBleStore';

// Mock characteristic value storage
class MockCharacteristicStore {
  private values: Map<string, string> = new Map();
  private monitors: Map<string, Set<(value: string) => void>> = new Map();

  private customButtonPressArray: number[] = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  private maxTimeBetween_ms: number = 500;
  private customButtonStatusEnabled: boolean = false;
  private customButtonPressUpdateState: number = 0;
  private indexToUpdate: number = 0;

  constructor() {
    // Try to load saved state first
    const savedState = MockBleStore.loadState();

    if (savedState) {
      // Restore from saved state
      console.log('Mock BLE: Restoring saved state');
      this.customButtonPressArray = savedState.customButtonPressArray;
      this.maxTimeBetween_ms = savedState.maxTimeBetween_ms;
      this.customButtonStatusEnabled = savedState.customButtonStatusEnabled;

      // Restore characteristic values
      Object.entries(savedState.characteristicValues).forEach(([uuid, value]) => {
        this.values.set(uuid, value);
      });
    } else {
      // Initialize with default values
      console.log('Mock BLE: Initializing with default values');
      this.values.set(BUSY_CHAR_UUID, '0');
      this.values.set(LEFT_STATUS_UUID, '0');
      this.values.set(RIGHT_STATUS_UUID, '0');
      this.values.set(SOFTWARE_UPDATING_CHAR_UUID, '0');
      this.values.set(SOFTWARE_STATUS_CHAR_UUID, 'idle');
      this.values.set(HEADLIGHT_MOTION_IN_UUID, '750');
      this.values.set(CUSTOM_COMMAND_UUID, '0');
      this.values.set(CLIENT_MAC_UUID, '0');
      this.values.set(FIRMWARE_UUID, '0.3.5');
    }
  }

  // Add getter methods for custom button state
  getCustomButtonArray(): number[] {
    return [...this.customButtonPressArray];
  }

  setCustomButtonArrayValue(index: number, value: number): void {
    if (index >= 0 && index < 10) {
      this.customButtonPressArray[index] = value;
      this.persistState();
    }
  }

  getMaxTimeBetween(): number {
    return this.maxTimeBetween_ms;
  }

  setMaxTimeBetween(value: number): void {
    this.maxTimeBetween_ms = value;
    this.persistState();
  }

  getCustomButtonEnabled(): boolean {
    return this.customButtonStatusEnabled;
  }

  setCustomButtonEnabled(enabled: boolean): void {
    this.customButtonStatusEnabled = enabled;
    this.persistState();
  }

  getValue(uuid: string): string {
    return this.values.get(uuid) || '';
  }

  setValue(uuid: string, value: string): void {
    this.values.set(uuid, value);
    this.notifyMonitors(uuid, value);
    this.persistState();
  }

  addMonitor(uuid: string, callback: (value: string) => void): () => void {
    if (!this.monitors.has(uuid)) {
      this.monitors.set(uuid, new Set());
    }
    this.monitors.get(uuid)!.add(callback);

    // Return cleanup function
    return () => {
      this.monitors.get(uuid)?.delete(callback);
    };
  }

  getIndexToUpdate(): number {
    return this.indexToUpdate;
  }

  setIndexToUpdate(index: number): void {
    this.indexToUpdate = index;
  }

  getCustomButtonPressUpdateState(): number {
    return this.customButtonPressUpdateState;
  }

  setCustomButtonPressUpdateState(state: number): void {
    this.customButtonPressUpdateState = state;
  }

  private notifyMonitors(uuid: string, value: string): void {
    const callbacks = this.monitors.get(uuid);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  // Persist current state to storage
  private persistState(): void {
    const state: MockBleState = {
      characteristicValues: Object.fromEntries(this.values),
      customButtonPressArray: [...this.customButtonPressArray],
      maxTimeBetween_ms: this.maxTimeBetween_ms,
      customButtonStatusEnabled: this.customButtonStatusEnabled,
    };
    MockBleStore.saveState(state);
  }

  reset(): void {
    this.values.clear();
    this.monitors.clear();
    MockBleStore.clearState();
  }
}

// Singleton store for mock characteristics
const mockStore = new MockCharacteristicStore();

// Mock Device implementation
export class MockDevice implements Partial<Device> {
  id: string;
  name: string | null;
  isConnected: () => Promise<boolean>;
  private connected: boolean = true;
  private disconnectCallback: ((error: any, device: Device) => void) | null = null;
  private animationQueue: Promise<void> = Promise.resolve();
  private customCommandInterrupted: boolean = false;
  serviceUUIDs?: string[];

  constructor(id: string = 'MOCK-MODULE-001', name: string = 'Open Wink Mock') {
    this.id = id;
    this.name = name;
    this.serviceUUIDs = [OTA_SERVICE_UUID, WINK_SERVICE_UUID, MODULE_SETTINGS_SERVICE_UUID];
    this.isConnected = async () => this.connected;
  }

  async discoverAllServicesAndCharacteristics(): Promise<Device> {
    console.log('Mock: Discovering services and characteristics');
    await this.simulateDelay(500);
    return this as unknown as Device;
  }

  async readCharacteristicForService(
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<any> {
    console.log(`Mock: Reading ${characteristicUUID}`);
    await this.simulateDelay(50);

    const value = mockStore.getValue(characteristicUUID);
    return {
      uuid: characteristicUUID,
      value: base64.encode(value),
    };
  }

  async writeCharacteristicWithoutResponseForService(
    serviceUUID: string,
    characteristicUUID: string,
    valueBase64: string
  ): Promise<any> {
    const decodedValue = base64.decode(valueBase64);
    console.log(`Mock: Writing ${characteristicUUID} = ${decodedValue}`);
    await this.simulateDelay(30);

    // Handle specific characteristic behaviors
    await this.handleCharacteristicWrite(characteristicUUID, decodedValue);

    return {
      uuid: characteristicUUID,
      value: valueBase64,
    };
  }

  monitorCharacteristicForService(
    serviceUUID: string,
    characteristicUUID: string,
    listener: (error: any, characteristic: any) => void
  ): Subscription {
    console.log(`Mock: Monitoring ${characteristicUUID}`);

    // Send initial value
    const initialValue = mockStore.getValue(characteristicUUID);
    setTimeout(() => {
      listener(null, {
        uuid: characteristicUUID,
        value: base64.encode(initialValue),
      });
    }, 100);

    // Setup monitor for future changes
    const cleanup = mockStore.addMonitor(characteristicUUID, (value) => {
      listener(null, {
        uuid: characteristicUUID,
        value: base64.encode(value),
      });
    });

    return {
      remove: cleanup,
    } as Subscription;
  }

  onDisconnected(
    listener: (error: BleError | null, device: Device) => void
  ): Subscription {
    this.disconnectCallback = listener;
    return { remove: () => { this.disconnectCallback = null; } } as Subscription;
  }

  async cancelConnection(): Promise<Device> {
    console.log('Mock: Disconnecting');
    this.connected = false;

    if (this.disconnectCallback) {
      setTimeout(() => {
        this.disconnectCallback!(null, this as unknown as Device);
      }, 100);
    }

    return this as unknown as Device;
  }

  private async handleCharacteristicWrite(uuid: string, value: string): Promise<void> {
    switch (uuid) {
      case HEADLIGHT_CHAR_UUID:
        await this.handleHeadlightCommand(parseInt(value));
        break;

      case CLIENT_MAC_UUID:
        // Connection acknowledged
        mockStore.setValue(CLIENT_MAC_UUID, '1');
        break;

      case CUSTOM_COMMAND_UUID:
        await this.handleCustomCommand(value);
        break;

      case CUSTOM_BUTTON_UPDATE_UUID:
        await this.handleCustomButtonPressUpdate(value);
        break;

      case HEADLIGHT_MOVEMENT_DELAY_UUID:
        mockStore.setValue(HEADLIGHT_MOVEMENT_DELAY_UUID, value);
        break;

      case SLEEPY_SETTINGS_UUID:
        mockStore.setValue(SLEEPY_SETTINGS_UUID, value);
        break;

      case SLEEPY_EYE_UUID:
        await this.handleSleepyEye();
        break;

      case SYNC_UUID:
        await this.handleSync();
        break;

      case LONG_TERM_SLEEP_UUID:
        await this.handleDeepSleep();
        break;

      case UNPAIR_UUID:
        await this.handleUnpair();
        break;

      case RESET_UUID:
        this.handleReset();
        break;

      case OTA_UUID:
        await this.handleOTA(value);
        break;
    }
  }

  private async handleHeadlightCommand(command: DefaultCommandValue): Promise<void> {
    this.animationQueue = this.animationQueue.then(async () => {
      const customCommandActive = mockStore.getValue(CUSTOM_COMMAND_UUID) === '1';

      if (!customCommandActive) {
        mockStore.setValue(BUSY_CHAR_UUID, '1');
      }
      try {
        const headlightMotionDuration = parseInt(mockStore.getValue(HEADLIGHT_MOTION_IN_UUID));

        switch (command) {
          case DefaultCommandValue.LEFT_UP:
            await this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.UP, headlightMotionDuration);
            break;

          case DefaultCommandValue.LEFT_DOWN:
            await this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.DOWN, headlightMotionDuration);
            break;

          case DefaultCommandValue.RIGHT_UP:
            await this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.UP, headlightMotionDuration);
            break;

          case DefaultCommandValue.RIGHT_DOWN:
            await this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.DOWN, headlightMotionDuration);
            break;

          case DefaultCommandValue.BOTH_UP:
            await Promise.all([
              this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.UP, headlightMotionDuration),
              this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.UP, headlightMotionDuration),
            ]);
            break;

          case DefaultCommandValue.BOTH_DOWN:
            await Promise.all([
              this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.DOWN, headlightMotionDuration),
              this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.DOWN, headlightMotionDuration),
            ]);
            break;

          case DefaultCommandValue.LEFT_WINK:
            await this.animateWink(LEFT_STATUS_UUID, headlightMotionDuration);
            break;

          case DefaultCommandValue.RIGHT_WINK:
            await this.animateWink(RIGHT_STATUS_UUID, headlightMotionDuration);
            break;

          case DefaultCommandValue.BOTH_BLINK:
            await this.animateBlink(headlightMotionDuration);
            break;

          case DefaultCommandValue.LEFT_WAVE:
            await this.animateWave('left', headlightMotionDuration);
            break;

          case DefaultCommandValue.RIGHT_WAVE:
            await this.animateWave('right', headlightMotionDuration);
            break;
        }
      } catch (error) {
        console.error('Error executing headlight command:', error);
      } finally {
        // Clear busy
        if (!customCommandActive) {
          mockStore.setValue(BUSY_CHAR_UUID, '0');
        }
        console.log('Mock: Headlight command complete');
      }
    });

    await this.animationQueue;
  }

  private async handleCustomCommand(value: string): Promise<void> {
    // New flow: first write is '1' to enable, second write is the command sequence
    if (value === '1') {
      // Enable custom command mode
      console.log('Mock: Custom command mode enabled');
      this.customCommandInterrupted = false;
      mockStore.setValue(CUSTOM_COMMAND_UUID, '1');
      mockStore.setValue(BUSY_CHAR_UUID, '1');
      return;
    }

    if (value === '0') {
      // Disable custom command mode (interrupt)
      console.log('Mock: Custom command interrupted');
      this.customCommandInterrupted = true;
      return;
    }

    // Parse and execute command sequence
    // Format: "4-d500-5-d500-4" where numbers are commands and d### are delays
    console.log(`Mock: Executing custom command sequence: ${value}`);

    this.animationQueue = this.animationQueue.then(async () => {
      try {
        const parts = value.split('-');
        const headlightMotionDuration = parseInt(mockStore.getValue(HEADLIGHT_MOTION_IN_UUID));

        for (const part of parts) {
          // Check if interrupted before each step
          if (this.customCommandInterrupted) {
            console.log('Mock: Custom command execution interrupted');
            break;
          }

          if (part.startsWith('d')) {
            // Delay command
            const delayMs = parseInt(part.substring(1));
            console.log(`Mock: Delaying ${delayMs}ms`);
            await this.simulateDelay(delayMs);
          } else {
            // Headlight command
            const command = parseInt(part);
            if (!isNaN(command)) {
              console.log(`Mock: Executing command ${command}`);
              await this.executeHeadlightCommand(command, headlightMotionDuration);
            }
          }
        }
      } catch (error) {
        console.error('Error executing custom command sequence:', error);
      } finally {
        if (!this.customCommandInterrupted) {
          console.log('Mock: Custom command sequence complete');
        } else {
          console.log('Mock: Custom command sequence terminated by interrupt');
        }
        mockStore.setValue(BUSY_CHAR_UUID, '0');
        mockStore.setValue(CUSTOM_COMMAND_UUID, '0');
        this.customCommandInterrupted = false;
      }
    });

    await this.animationQueue;
  }

  private async executeHeadlightCommand(command: DefaultCommandValue, motionTime: number): Promise<void> {
    // Execute individual headlight command without setting busy flag
    // (busy is already managed by custom command handler)
    switch (command) {
      case DefaultCommandValue.LEFT_UP:
        await this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.UP, motionTime);
        break;

      case DefaultCommandValue.LEFT_DOWN:
        await this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.DOWN, motionTime);
        break;

      case DefaultCommandValue.RIGHT_UP:
        await this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.UP, motionTime);
        break;

      case DefaultCommandValue.RIGHT_DOWN:
        await this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.DOWN, motionTime);
        break;

      case DefaultCommandValue.BOTH_UP:
        await Promise.all([
          this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.UP, motionTime),
          this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.UP, motionTime),
        ]);
        break;

      case DefaultCommandValue.BOTH_DOWN:
        await Promise.all([
          this.animateStatus(LEFT_STATUS_UUID, ButtonStatus.DOWN, motionTime),
          this.animateStatus(RIGHT_STATUS_UUID, ButtonStatus.DOWN, motionTime),
        ]);
        break;

      case DefaultCommandValue.LEFT_WINK:
        await this.animateWink(LEFT_STATUS_UUID, motionTime);
        break;

      case DefaultCommandValue.RIGHT_WINK:
        await this.animateWink(RIGHT_STATUS_UUID, motionTime);
        break;

      case DefaultCommandValue.BOTH_BLINK:
        await this.animateBlink(motionTime);
        break;

      case DefaultCommandValue.LEFT_WAVE:
        await this.animateWave('left', motionTime);
        break;

      case DefaultCommandValue.RIGHT_WAVE:
        await this.animateWave('right', motionTime);
        break;
    }
  }

  private buttonStatusToPercentage(status: ButtonStatus): number {
    return status === ButtonStatus.UP ? 100 : 0;
  }

  private async animateStatus(
    statusUUID: string,
    targetStatus: number,
    duration: number
  ): Promise<void> {
    const targetPercentage = this.buttonStatusToPercentage(targetStatus);
    await this.animateToPercentage(statusUUID, targetPercentage, duration);
  }

  private encodePercentageToValue(percentage: number): number {
    if (percentage >= 100) return ButtonStatus.UP;
    if (percentage <= 0) return ButtonStatus.DOWN;
    // Encode as decimal representation
    return Math.round(percentage + 10);
  }

  private decodeValueToPercentage(value: number): number {
    if (value === ButtonStatus.UP) return 100;
    if (value === ButtonStatus.DOWN) return 0;
    if (value >= 10 && value <= 110) {
      return Math.round((value - 10) / 100 * 100);
    }
    return 0; // Default fallback
  }

  private async animateToPercentage(
    statusUUID: string,
    targetPercentage: number,
    duration: number
  ): Promise<void> {
    const clampedTarget = Math.max(0, Math.min(100, targetPercentage));
    const currentValue = parseInt(mockStore.getValue(statusUUID));
    let currentPercentage = this.decodeValueToPercentage(currentValue);

    if (currentPercentage === clampedTarget) {
      return; // Already at target
    }

    if (currentPercentage !== 0 && currentPercentage !== 100) {
      const motionTime = duration * (Math.abs(100 - currentPercentage) / 100);
      // Currently in intermediate position - must go all the way up first
      await this.animateDirectly(statusUUID, currentPercentage, 100, motionTime);
      currentPercentage = 100;
      if (clampedTarget === 100) {
        return;
      }
    }

    if (currentPercentage === 100) {
      // Must go all the way down first
      await this.animateDirectly(statusUUID, currentPercentage, 0, duration);
      currentPercentage = 0;
      if (clampedTarget === 0) {
        return;
      }
    }

    if (currentPercentage === 0) {
      const motionTime = duration * (clampedTarget / 100);
      // Now can go up to the target
      await this.animateDirectly(statusUUID, 0, clampedTarget, motionTime);
    }
  }

  private async animateDirectly(
    statusUUID: string,
    fromPercentage: number,
    toPercentage: number,
    duration: number
  ): Promise<void> {
    if (fromPercentage === toPercentage) {
      return;
    }

    const steps = 10;
    const stepDuration = duration / steps;

    for (let i = 1; i <= steps; i++) {
      await this.simulateDelay(stepDuration);

      const progress = i / steps;
      const currentPosition = fromPercentage + (toPercentage - fromPercentage) * progress;

      if (i === steps) {
        mockStore.setValue(statusUUID, this.encodePercentageToValue(toPercentage).toString());
      } else {
        mockStore.setValue(statusUUID, this.encodePercentageToValue(currentPosition).toString());
      }
    }
  }

  private async animateWink(statusUUID: string, motionTime: number): Promise<void> {
    const currentStatus = parseInt(mockStore.getValue(statusUUID));
    const opposite = currentStatus === ButtonStatus.UP ? ButtonStatus.DOWN : ButtonStatus.UP;

    await this.animateStatus(statusUUID, opposite, motionTime);
    await this.animateStatus(statusUUID, currentStatus, motionTime);
  }

  private async animateBlink(motionTime: number): Promise<void> {
    const leftStatus = parseInt(mockStore.getValue(LEFT_STATUS_UUID));
    const rightStatus = parseInt(mockStore.getValue(RIGHT_STATUS_UUID));

    const opposite = leftStatus === ButtonStatus.UP ? ButtonStatus.DOWN : ButtonStatus.UP;

    await Promise.all([
      this.animateStatus(LEFT_STATUS_UUID, opposite, motionTime),
      this.animateStatus(RIGHT_STATUS_UUID, opposite, motionTime),
    ]);
    await Promise.all([
      this.animateStatus(LEFT_STATUS_UUID, leftStatus, motionTime),
      this.animateStatus(RIGHT_STATUS_UUID, rightStatus, motionTime),
    ]);
  }

  private async animateWave(direction: 'left' | 'right', motionTime: number): Promise<void> {
    const firstUUID = direction === 'left' ? LEFT_STATUS_UUID : RIGHT_STATUS_UUID;
    const secondUUID = direction === 'left' ? RIGHT_STATUS_UUID : LEFT_STATUS_UUID;
    const motionDelayPercent = mockStore.getValue(HEADLIGHT_MOVEMENT_DELAY_UUID);
    const motionDelay = parseInt(motionDelayPercent);

    const delay = motionTime - (motionTime * motionDelay);

    const firstStatus = parseInt(mockStore.getValue(firstUUID));
    const secondStatus = parseInt(mockStore.getValue(secondUUID));
    const oppositeFirst = firstStatus === ButtonStatus.UP ? ButtonStatus.DOWN : ButtonStatus.UP;
    const oppositeSecond = secondStatus === ButtonStatus.UP ? ButtonStatus.DOWN : ButtonStatus.UP;

    await Promise.all([
      (async () => {
        await this.animateStatus(firstUUID, oppositeFirst, motionTime);
        await this.simulateDelay(delay);
        await this.animateStatus(firstUUID, firstStatus, motionTime);
      })(),
      (async () => {
        await this.simulateDelay(delay);
        await this.animateStatus(secondUUID, oppositeSecond, motionTime);
        await this.simulateDelay(delay);
        await this.animateStatus(secondUUID, secondStatus, motionTime);
      })(),
    ]);
  }

  private async handleCustomButtonPressUpdate(value: string): Promise<void> {
    console.log(`Mock: Custom button press update - Value: ${value}`);

    // Handle enable/disable commands
    if (value === "enable") {
      mockStore.setCustomButtonEnabled(true);
      console.log('Mock: Custom button status enabled');
      return;
    } else if (value === "disable") {
      mockStore.setCustomButtonEnabled(false);
      console.log('Mock: Custom button status disabled');
      return;
    }

    try {
      const parsedValue = parseInt(value);

      // Updating maxTime (multi-digit values)
      if (value.length > 1) {
        mockStore.setMaxTimeBetween(parsedValue);
        console.log(`Mock: Max time between updated to ${parsedValue}ms`);
      } else {
        // Single digit - state machine for array updates
        if (mockStore.getCustomButtonPressUpdateState() === 0) {
          // First state: receive index
          if (parsedValue > 9) {
            console.log('Mock: Invalid index, ignoring');
            return;
          }
          mockStore.setIndexToUpdate(parsedValue);
          mockStore.setCustomButtonPressUpdateState(1);
          console.log(`Mock: Index to update set to ${parsedValue}`);
        } else {
          // Second state: receive value for the index
          mockStore.setCustomButtonPressUpdateState(0);

          if (mockStore.getIndexToUpdate() === 0) {
            console.log('Mock: Cannot update index 0, ignoring');
            return;
          }

          const indexToUpdate = mockStore.getIndexToUpdate();
          const currentArray = mockStore.getCustomButtonArray();
          currentArray[indexToUpdate] = parsedValue;
          mockStore.setCustomButtonArrayValue(indexToUpdate, parsedValue);

          console.log(`Mock: Set button array[${indexToUpdate}] = ${parsedValue}`);

          // Handle array compaction when setting to 0
          if (parsedValue === 0) {
            let maxIndexNotZero = 0;
            for (let i = 0; i < 10; i++) {
              if (currentArray[i] === 0) {
                maxIndexNotZero = i;
                break;
              }
            }

            // Shift array elements left to remove gaps
            for (let i = maxIndexNotZero; i < 9; i++) {
              const nextValue = currentArray[i + 1];
              currentArray[i] = nextValue;
              mockStore.setCustomButtonArrayValue(i, nextValue);
            }

            console.log('Mock: Compacted button array after setting to 0');
            console.log('Mock: New array:', currentArray);
          }
        }
      }
    } catch (error) {
      console.error('Mock: Error parsing custom button press value:', error);
    }
  }

  private async handleSleepyEye(): Promise<void> {
    // Simulate partial closing based on settings
    const settings = mockStore.getValue(SLEEPY_SETTINGS_UUID);
    let leftTarget = 50;
    let rightTarget = 50;

    const headlightMotionDuration = mockStore.getValue(HEADLIGHT_MOTION_IN_UUID);
    const motionTime = parseInt(headlightMotionDuration);

    // Settings format: "left-right" percentages
    if (settings) {
      try {
        const [left, right] = settings.split('-').map(Number);
        leftTarget = isNaN(left) ? 50 : left;
        rightTarget = isNaN(right) ? 50 : right;
      } catch {
        // If parsing fails, fall back to defaults
      }
    }

    mockStore.setValue(BUSY_CHAR_UUID, '1');
    await Promise.all([
      this.animateToPercentage(LEFT_STATUS_UUID, leftTarget, motionTime),
      this.animateToPercentage(RIGHT_STATUS_UUID, rightTarget, motionTime),
    ]);
    mockStore.setValue(BUSY_CHAR_UUID, '0');
  }

  private async handleSync(): Promise<void> {
    const left = parseInt(mockStore.getValue(LEFT_STATUS_UUID));
    const right = parseInt(mockStore.getValue(RIGHT_STATUS_UUID));
    const headlightMotionDuration = mockStore.getValue(HEADLIGHT_MOTION_IN_UUID);
    const motionTime = parseInt(headlightMotionDuration);

    // Sync to average position
    const target = Math.round((left + right) / 2);

    mockStore.setValue(BUSY_CHAR_UUID, '1');
    await Promise.all([
      this.animateStatus(LEFT_STATUS_UUID, target, motionTime),
      this.animateStatus(RIGHT_STATUS_UUID, target, motionTime),
    ]);
    mockStore.setValue(BUSY_CHAR_UUID, '0');
  }

  private async handleDeepSleep(): Promise<void> {
    console.log('Mock: Entering deep sleep');
    await this.simulateDelay(500);
    await this.cancelConnection();
  }

  private async handleUnpair(): Promise<void> {
    console.log('Mock: Unpairing');
    await this.simulateDelay(200);
    await this.cancelConnection();
  }

  private handleReset(): void {
    console.log('Mock: Resetting to factory defaults');
    mockStore.reset();
  }

  private async handleOTA(password: string): Promise<void> {
    console.log('Mock: Starting OTA update');
    mockStore.setValue(SOFTWARE_STATUS_CHAR_UUID, 'updating');

    // Simulate firmware update progress
    for (let i = 0; i <= 100; i += 10) {
      await this.simulateDelay(500);
      mockStore.setValue(SOFTWARE_UPDATING_CHAR_UUID, i.toString());
    }

    mockStore.setValue(SOFTWARE_STATUS_CHAR_UUID, 'success');
    mockStore.setValue(FIRMWARE_UUID, '0.3.5');
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mock BLE Manager
export class MockBleManager implements Partial<BleManager> {
  private mockDevice: MockDevice | null = null;
  private scanCallback: ((error: any, device: Device | null) => void) | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;

  async state(): Promise<State> {
    return State.PoweredOn;
  }

  async startDeviceScan(
    UUIDs: string[] | null,
    options: ScanOptions | null,
    listener: (error: BleError | null, scannedDevice: Device | null) => void
  ): Promise<void> {
    console.log('Mock: Starting device scan');
    this.scanCallback = listener;

    // Simulate finding device after 2 seconds
    this.scanTimeout = setTimeout(() => {
      if (this.scanCallback) {
        this.mockDevice = new MockDevice();
        console.log('Mock: Device found');
        this.scanCallback(null, this.mockDevice as unknown as Device);
      }
    }, 2000);
  }

  async stopDeviceScan(): Promise<void> {
    console.log('Mock: Stopping device scan');
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.scanCallback = null;
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    console.log(`Mock: Connecting to device ${deviceId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!this.mockDevice || this.mockDevice.id !== deviceId) {
      this.mockDevice = new MockDevice(deviceId);
    }

    return this.mockDevice as unknown as Device;
  }

  async destroy(): Promise<void> {
    console.log('Mock: Destroying BLE manager');
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    this.mockDevice = null;
  }
}
