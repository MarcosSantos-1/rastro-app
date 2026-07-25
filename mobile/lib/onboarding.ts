import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "rastro_onboarding_completed";

export async function isOnboardingCompleted(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "1";
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}
