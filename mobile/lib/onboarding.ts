import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * v4: gate no root layout (não só em index) — evita pular onboarding
 * quando o Expo Router restaura a última rota nas tabs.
 */
const KEY = "rastro_onboarding_completed_v4";
const LEGACY_KEYS = [
  "rastro_onboarding_completed",
  "rastro_onboarding_completed_v2",
  "rastro_onboarding_completed_v3",
];

type Listener = (done: boolean) => void;
const listeners = new Set<Listener>();

export function subscribeOnboarding(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(done: boolean) {
  listeners.forEach((l) => l(done));
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "1";
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
  notify(true);
}

export async function clearOnboardingCompleted(): Promise<void> {
  await AsyncStorage.multiRemove([KEY, ...LEGACY_KEYS]);
  notify(false);
}
