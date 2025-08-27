import { QuickLink } from "../Components";
import Storage from "./Storage";

const QUICKLINKS_KEY = "quick-links";

const DEFAULTS: QuickLink[] = [
  {
    icon: "speedometer-outline",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "CustomWinkButton"
    },
    title: "Set Up Custom Wink Button"
  },
  {
    icon: "color-fill-outline",
    navigation: {
      back: "Home",
      backHumanReadable: "Home",
      page: "Theme"
    },
    title: "Change App Theme"
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