import { Landing } from "./Landing";
import { DefaultCommands } from "./DefaultCommands";
import { CreateCustomCommands } from "./CreateCustomCommands";
import { ModuleSettings } from "./ModuleSettings";
import { WaveSleepy } from "./WaveSleepy";
import { ButtonActions } from "./ButtonActions";
import { Updates } from "./Updates";
import { ConnectionSecurity } from "./ConnectionSecurity";

type ScreensType = () => JSX.Element;

export const ONBOARDING_SCREENS: ScreensType[] = [ 
  Landing,
  DefaultCommands,
  CreateCustomCommands,
  ModuleSettings,
  WaveSleepy,
  ButtonActions,
  Updates,
  ConnectionSecurity,
]