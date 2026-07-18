import Storage from "./Storage";

const ONBOARDING_KEY = "onboarding-key";

export abstract class OnboardingStore {
  static complete() {
    Storage.set(ONBOARDING_KEY, true);
  }

  static reset() {
    Storage.delete(ONBOARDING_KEY);
  }

  static getStatus() {
    const status = Storage.getBoolean(ONBOARDING_KEY);
    if (status) return true;
    else return false;
  }
}