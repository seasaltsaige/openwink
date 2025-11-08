import { QuickLink } from "../Components";
import Storage from "./Storage";

const QUICKLINKS_KEY = "quick-links";

const DEFAULTS: QuickLink[] = [
  {
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "WaveDelaySettings"
    },
    icon: "radio-outline",
    title: "Wave Delay Settings"
  },
  {
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "CustomWinkButton",
    },
    icon: "speedometer-outline",
    title: "Set Up Custom Wink Button",
  },
  {
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "SleepyEyeSettings",
    },
    icon: "eye-outline",
    title: "Sleepy Eye Settings",
  }
]
export abstract class QuickLinksStore {

  static getLinks(): QuickLink[] {
    const linksFromStorage = Storage.getString(QUICKLINKS_KEY);
    if (!linksFromStorage) return DEFAULTS;

    const parsed = JSON.parse(linksFromStorage);
    return parsed as QuickLink[];
  }

  static setLinks(links: QuickLink[]) {
    Storage.set(QUICKLINKS_KEY, JSON.stringify(links));
  }

  static reset() {
    Storage.delete(QUICKLINKS_KEY);
  }

}