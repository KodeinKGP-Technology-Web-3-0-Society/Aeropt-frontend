import { NativePreferences } from "../platform";

const KEYS = {
  FIRST_RUN_DONE: "jeepath_native_first_run_done",
  LAST_TAB: "jeepath_native_last_tab",
  REDUCE_MOTION: "jeepath_native_reduce_motion",
  ONBOARDING_SAVED_STEP: "jeepath_native_onboarding_step",
} as const;

export async function hasCompletedFirstRun(): Promise<boolean> {
  const val = await NativePreferences.get(KEYS.FIRST_RUN_DONE);
  return val === "true";
}

export async function setFirstRunDone(done = true): Promise<void> {
  await NativePreferences.set(KEYS.FIRST_RUN_DONE, done ? "true" : "false");
}

export async function getLastTab(fallback = "home"): Promise<string> {
  const val = await NativePreferences.get(KEYS.LAST_TAB);
  return val || fallback;
}

export async function setLastTab(tab: string): Promise<void> {
  await NativePreferences.set(KEYS.LAST_TAB, tab);
}

export async function getReducedMotionPref(): Promise<boolean> {
  const val = await NativePreferences.get(KEYS.REDUCE_MOTION);
  return val === "true";
}

export async function setReducedMotionPref(enabled: boolean): Promise<void> {
  await NativePreferences.set(KEYS.REDUCE_MOTION, enabled ? "true" : "false");
}

export async function getSavedOnboardingStep(): Promise<number | null> {
  const val = await NativePreferences.get(KEYS.ONBOARDING_SAVED_STEP);
  return val ? parseInt(val, 10) : null;
}

export async function setSavedOnboardingStep(step: number): Promise<void> {
  await NativePreferences.set(KEYS.ONBOARDING_SAVED_STEP, step.toString());
}
