import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  type FirestoreSettings,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { assertFirebaseConfig, firebaseConfig } from "./config";

assertFirebaseConfig();
export const app: FirebaseApp = getApps().length
  ? getApps()[0]!
  : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();

/**
 * React Native / Expo: o transporte padrão (WebChannel + fetch streams)
 * costuma falhar de forma intermitente ("Backend didn't respond within 10 seconds"),
 * em especial no iOS via Expo Go. Long polling + XHR é o fallback mais estável.
 *
 * Obs.: no Expo Go o mapa iOS usa Apple Maps (não depende da Google Maps key).
 * O Firestore conecta direto do celular à Google — VPN / Private Relay / Wi‑Fi
 * instável no iPhone costuma ser a causa quando Android funciona e iOS não.
 */
const firestoreSettings: FirestoreSettings & { useFetchStreams?: boolean } = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
};

export const db = initializeFirestore(app, firestoreSettings);
export const storage = getStorage(app);
