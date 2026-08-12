import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RastroMapMarker } from "@/components/RastroNativeMap";

const KEY = "rastro_ecopontos_intro_seen_v1";

let pendingEcoponto: RastroMapMarker | null = null;

export async function hasSeenEcopontosIntro(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "1";
}

export async function setEcopontosIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}

export function setPendingEcoponto(marker: RastroMapMarker): void {
  pendingEcoponto = marker;
}

export function takePendingEcoponto(): RastroMapMarker | null {
  const m = pendingEcoponto;
  pendingEcoponto = null;
  return m;
}
