import Constants from "expo-constants";
import type { LocationGeocodedAddress } from "expo-location";
import * as Location from "expo-location";

export type GoogleReverseGeocodeResult = {
  address: string;
  bairro: string;
  municipio: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeResponse = {
  status: string;
  results?: {
    formatted_address: string;
    address_components: AddressComponent[];
  }[];
  error_message?: string;
};

function getApiKey(): string {
  const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;
  const fromExtra = extra?.googleMapsApiKey?.trim();
  if (fromExtra) return fromExtra;
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

function pickComponent(components: AddressComponent[], types: string[]): string {
  for (const t of types) {
    const hit = components.find((c) => c.types.includes(t));
    if (hit?.long_name) return hit.long_name;
  }
  return "";
}

function formatNativeAddress(r: LocationGeocodedAddress): string {
  const street = [r.street, r.streetNumber].filter(Boolean).join(", ").trim();
  const line1 = street || r.name || "";
  const parts = [line1, r.district || r.subregion, r.city || r.region].filter(
    (x) => typeof x === "string" && x.trim().length > 0,
  ) as string[];
  return parts.join(" — ").trim();
}

async function reverseGeocodeNative(
  lat: number,
  lng: number,
): Promise<GoogleReverseGeocodeResult | null> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const first = places[0];
    if (!first) return null;
    const address = formatNativeAddress(first);
    if (!address) return null;
    return {
      address,
      bairro: first.district || first.subregion || "",
      municipio: first.city || first.subregion || first.region || "",
    };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode: Google Geocoding API (pt-BR), com fallback nativo do dispositivo.
 * Requer EXPO_PUBLIC_GOOGLE_MAPS_API_KEY com Geocoding API ativa (billing no projeto).
 */
export async function reverseGeocodeGoogle(
  lat: number,
  lng: number,
): Promise<GoogleReverseGeocodeResult | null> {
  const key = getApiKey();
  if (key) {
    try {
      const u = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      u.searchParams.set("latlng", `${lat},${lng}`);
      u.searchParams.set("key", key);
      u.searchParams.set("language", "pt-BR");

      const res = await fetch(u.toString());
      if (res.ok) {
        const data = (await res.json()) as GeocodeResponse;
        if (data.status === "OK" && data.results?.length) {
          const first = data.results[0];
          const components = first.address_components ?? [];
          const address = first.formatted_address?.trim();
          if (address) {
            return {
              address,
              bairro: pickComponent(components, [
                "sublocality_level_1",
                "sublocality",
                "neighborhood",
              ]),
              municipio: pickComponent(components, [
                "administrative_area_level_2",
                "locality",
              ]),
            };
          }
        } else if (__DEV__) {
          console.warn(
            "[geocode] Google status:",
            data.status,
            data.error_message ?? "",
          );
        }
      }
    } catch (e) {
      if (__DEV__) console.warn("[geocode] Google fetch failed", e);
    }
  } else if (__DEV__) {
    console.warn("[geocode] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ausente");
  }

  return reverseGeocodeNative(lat, lng);
}
