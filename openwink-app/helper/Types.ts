import { BehaviorEnum, DefaultCommandValue } from "../helper/Constants";


export type ButtonBehaviors = "Default Behavior" | "Left Wink" | "Left Wink x2" | "Right Wink" | "Right Wink x2" | "Both Blink" | "Both Blink x2" | "Left Wave" | "Right Wave" | "Sleepy Eye";
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
};