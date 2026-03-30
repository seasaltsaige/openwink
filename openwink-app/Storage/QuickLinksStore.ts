import { QuickLink } from "../Components";
import Storage from "./Storage";

const QUICKLINKS_KEY = "quick-links";

const DEFAULTS: QuickLink[] = [
  {
    icon: "eye-outline",
    title: "Sleepy Eye Settings",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "SleepyEyeSettings",
    },
  },
  {
    icon: "speedometer-outline",
    title: "Customize Button Actions",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "CustomWinkButton",
    },
  },
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