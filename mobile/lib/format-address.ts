import type { LocationGeocodedAddress } from "expo-location";

/** Monta um texto legível a partir do reverse geocode nativo (iOS/Android). */
export function formatAddressFromGeocode(r: LocationGeocodedAddress): string {
  const street = [r.street, r.streetNumber].filter(Boolean).join(", ").trim();
  const line1 = street || r.name || "";
  const parts = [line1, r.district || r.subregion, r.city || r.region].filter(
    (x) => typeof x === "string" && x.trim().length > 0,
  ) as string[];
  const s = parts.join(" — ").trim();
  return s.length > 0 ? s : "";
}
