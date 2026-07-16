import { Landing } from "./Landing";
import { DefaultCommands } from "./DefaultCommands";
import { CreateCustomCommands } from "./CreateCustomCommands";
import { RunCustomCommands } from "./RunCustomCommands";
import { ModuleSettings } from "./ModuleSettings";
import { WaveSleepy } from "./WaveSleepy";
import { ButtonActions } from "./ButtonActions";
import { AuxButtonActions } from "./AuxButtonActions";
import { Updates } from "./Updates";
import { ConnectionSecurity } from "./ConnectionSecurity";

type ScreensType = () => JSX.Element;

export const ONBOARDING_SCREENS: ScreensType[] = [ 
  Landing,
  DefaultCommands,
  CreateCustomCommands,
  // RunCustomCommands,
  ModuleSettings,
  WaveSleepy,
  // SleepyEye,
  ButtonActions,
  // AuxButtonActions,
  Updates,
  ConnectionSecurity,
]