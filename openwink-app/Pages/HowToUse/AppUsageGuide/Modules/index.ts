import { Connection } from "./Connection";
import { DefaultCommands } from "./DefaultCommands";
import { CreateCustomCommands } from "./CreateCustomCommands";
import { QuickLinks } from "./QuickLinks";
import { Firmware } from "./Firmware";
import { RunCustomCommand } from "./RunCustomCommand";
import { Theme } from "./Theme";
import { AutoConnectOrientation } from "./AutoConnectOrientation";
import { WaveDelay } from "./WaveDelay";
import { SleepyEye } from "./SleepyEye";
import { CustomButton } from "./CustomButton";
import { ModuleManagement } from "./ModuleManagement";

export const AppUsageModules = [
  { Component: Connection, name: "connection", },
  { Component: DefaultCommands, name: "default", },
  { Component: CreateCustomCommands, name: "create_custom", },
  { Component: RunCustomCommand, name: "run_custom", },
  { Component: QuickLinks, name: "quick_links", },
  { Component: Firmware, name: "firmware", },
  { Component: Theme, name: "theme", },
  { Component: AutoConnectOrientation, name: "auto_connect", },
  { Component: WaveDelay, name: "wave", },
  { Component: SleepyEye, name: "sleepy", },
  { Component: CustomButton, name: "custom_button", },
  { Component: ModuleManagement, name: "management", },
];