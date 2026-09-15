import { BehaviorEnum, buttonBehaviorMap, DefaultCommandValue } from "../helper/Constants";

export const buttonBehaviorList = ["Default Behavior", "Left Wink", "Left Wink x2", "Left-Right", "Left-Right x2", "Right Wink", "Right Wink x2", "Right-Left", "Right-Left x2", "Both Blink", "Both Blink x2", "Left Wave", "Right Wave", "Sleepy Eye"] as const;
export type ButtonBehaviors = typeof buttonBehaviorList[number];
export type Presses = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface CommandInput {
  delay?: number;
  transmitValue?: DefaultCommandValue;
}

export interface CommandOutput {
  name: string;
  command?: CommandInput[];
}

export type CustomButtonAction = {
  customCommand?: CommandOutput,
  behavior?: BehaviorEnum | null;
  behaviorHumanReadable?: ButtonBehaviors | null;
  presses: Presses;
  looping: boolean;
};

export enum UpdatingStatus {
  IDLE,
  UPDATING,
  ERROR_FLASH_INIT,
  ERROR_VERIFICATION_INIT,
  ERROR_INVALID_SIZE,
  ERROR_VERIFICATION_SIGN,
  ERROR_CHUNK_WRITE,
  SUCCESS,
}

export const ErrorTypes = {
  ota_unknown: "E1110",
  ota_flash_init: "E1111",
  ota_verification_init: "E1112",
  ota_invalid_size: "E1113",
  ota_verification_sign: "E1114",
  ota_chunk_write: "E1115",
}