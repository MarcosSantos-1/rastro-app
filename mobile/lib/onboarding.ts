import AsyncStorage from "@react-native-async-storage/async-storage";

/** v2: onboarding fullscreen/swipe — invalida flag da versão anterior. */
const KEY = "rastro_onboarding_completed_v2";
const LEGACY_KEY = "rastro_onboarding_completed";

export async function isOnboardingCompleted(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "1";
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.multiSet([
    [KEY, "1"],
    [LEGACY_KEY, "1"],
  ]);
}

export async function clearOnboardingCompleted(): Promise<void> {
  await AsyncStorage.multiRemove([KEY, LEGACY_KEY]);
}
