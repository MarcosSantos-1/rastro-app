import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from "react-native-maps";
import { colors } from "@/constants/colors";

const CARTO_LIGHT = "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const FALLBACK = { lat: -23.5505, lng: -46.6333 };

/** Esconde o mapa-base do Google para sobrar só o Carto Positron (sem logo Leaflet). */
const HIDDEN_BASE = [
  { stylers: [{ visibility: "off" as const }] },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ visibility: "on" as const }, { color: "#f4f4f4" }],
  },
];

export type HomeMiniMapDot = {
  id: string;
  lat: number;
  lng: number;
  kind: "ocorrencia" | "ecoponto";
};

type Props = {
  center: { lat: number; lng: number } | null;
  user: { lat: number; lng: number } | null;
  dots: HomeMiniMapDot[];
};

export function HomeMiniMap({ center, user, dots }: Props) {
  const lat = user?.lat ?? center?.lat ?? FALLBACK.lat;
  const lng = user?.lng ?? center?.lng ?? FALLBACK.lng;
  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.016,
    longitudeDelta: 0.016,
  };

  return (
    <View style={styles.wrap} pointerEvents="none">
      <MapView
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType={Platform.OS === "android" ? "none" : "standard"}
        customMapStyle={HIDDEN_BASE}
        initialRegion={region}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={false}
        legalLabelInsets={{ top: 0, right: -80, bottom: -80, left: 0 }}
      >
        <UrlTile
          urlTemplate={CARTO_LIGHT}
          maximumZ={19}
          zIndex={-1}
          shouldReplaceMapContent
        />
        {dots.map((d) => (
          <Marker
            key={d.id}
            coordinate={{ latitude: d.lat, longitude: d.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    d.kind === "ecoponto" ? colors.pinBlue : colors.statusGreen,
                },
              ]}
            />
          </Marker>
        ))}
        {user ? (
          <Marker
            coordinate={{ latitude: user.lat, longitude: user.lng }}
            anchor={{ x: 0.5, y: 0.55 }}
            tracksViewChanges={false}
          >
            <Ionicons name="navigate" size={18} color={colors.cta} />
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});
