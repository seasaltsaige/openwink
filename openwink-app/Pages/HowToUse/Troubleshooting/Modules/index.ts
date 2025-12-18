import { Commands } from "./Commands";
import { Connection } from "./Connection";
import { OrientationMovement } from "./OrientationMovement";
import { Button } from "./Button";
import { MoreTrouble } from "./MoreTrouble";

export const TroubleshootingModules = [
  { Component: Connection, name: "connection", },
  { Component: Commands, name: "commands", },
  { Component: OrientationMovement, name: "orientation", },
  { Component: Button, name: "button" },

  { Component: MoreTrouble, name: "more_trouble" },
];