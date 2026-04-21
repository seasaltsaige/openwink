import Storage from "./Storage";
import { CustomCommandStore } from ".";
import { buttonBehaviorList, ButtonBehaviors, CommandOutput } from "../helper/Types";

const FREQUENCY_KEY = "custom-frequency";


type FrequencyData = {
  name: string;
  uses: number;
}

const FrequencyDefaults: FrequencyData[] = [
  { name: "Left Wave", uses: 0 },
  { name: "Left Wink x2", uses: 0 },
  { name: "Right-Left x2", uses: 0 },
  { name: "Sleepy Eye", uses: 0 },
  { name: "Right Wink x2", uses: 0 },
];

export abstract class CustomButtonFrequencyStore {
  static getTopFive(): FrequencyData[] {
    const keys = Storage.getAllKeys();

    const all: FrequencyData[] = [];
    for (const key of keys) {
      if (!key.startsWith(FREQUENCY_KEY)) continue;
    
      const uses = Storage.getNumber(key);
      if (uses === undefined) continue;
    
      all.push({ name: key.slice(FREQUENCY_KEY.length + 1), uses });
    }
    if (all.length === 0) return FrequencyDefaults;
    
    all.sort((a, b) => a.uses - b.uses);
    const top = all.slice(0, 5);

    if (top.length === 5) return top;

    const usedNames = new Set(top.map(f => f.name));
    for (const def of FrequencyDefaults) {
      if (!usedNames.has(def.name)) {
        top.push(def);
        if (top.length === 5) break;
      }
    }

    return top;
  }

  static increment(command: (Exclude<ButtonBehaviors, "Default Behavior"> | CommandOutput)) {
    let name = "";
    if (typeof command === "string") name = command;
    else name = command.name;

    const exists = Storage.getNumber(`${FREQUENCY_KEY}-${name}`);
    if (exists) return Storage.set(`${FREQUENCY_KEY}-${name}`, (exists+1));
    else return Storage.set(`${FREQUENCY_KEY}-${name}`, 1);
  }

  static decay() {
    const allFreqs = Storage.getAllKeys()
      .filter(k => k.startsWith(FREQUENCY_KEY))
      .map((key) => ({ uses: Storage.getNumber(key) || 0, key }));

    for (const freq of allFreqs) {
      freq.uses = freq.uses * 0.95;
      Storage.set(freq.key, freq.uses);
    }
    
  }

  static reset() {
    Storage.getAllKeys().filter(key => key.startsWith(FREQUENCY_KEY)).forEach(key => Storage.delete(key));
  }
}