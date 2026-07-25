import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;

function pick(envKey: string, extraKey: string): string {
  const fromEnv = process.env[envKey];
  if (fromEnv) return fromEnv;
  const fromExtra = extra?.[extraKey];
  if (fromExtra) return String(fromExtra);
  return "";
}

/** Preencha via .env (EXPO_PUBLIC_*) ou app.config extra — ver docs/FIREBASE_ENV.md */
export const firebaseConfig = {
  apiKey: pick("EXPO_PUBLIC_FIREBASE_API_KEY", "firebaseApiKey"),
  authDomain: pick("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", "firebaseAuthDomain"),
  projectId: pick("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "firebaseProjectId"),
  storageBucket: pick("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", "firebaseStorageBucket"),
  messagingSenderId: pick("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "firebaseMessagingSenderId"),
  appId: pick("EXPO_PUBLIC_FIREBASE_APP_ID", "firebaseAppId"),
};

/** @deprecated use firebaseConfig */
export type FirebasePublicConfig = typeof firebaseConfig;

export function assertFirebaseConfig(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `Firebase: defina EXPO_PUBLIC_* no .env (${missing.join(", ")}) ou extra no app.config.`,
    );
  }
}
