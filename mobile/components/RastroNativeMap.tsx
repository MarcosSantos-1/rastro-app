import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { colors } from "@/constants/colors";
import { useRastroTheme } from "@/contexts/ThemeContext";
import { MAP_RADIUS_M } from "@/lib/submit-denuncia";

export type RastroMapMarkerKind = "ecoponto" | "pendente" | "resolvido";

export type RastroMapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: RastroMapMarkerKind;
  title?: string;
  photoUrl?: string;
  photoUrls?: string[];
  categoria?: string;
  createdAt?: string;
  endereco?: string;
  statusLabel?: string;
  distanceM?: number;
};

export type RastroNativeMapProps = {
  centerLat: number;
  centerLng: number;
  markers: RastroMapMarker[];
  user: { lat: number; lng: number } | null;
  selectedId?: string | null;
  onMarkerPress?: (marker: RastroMapMarker) => void;
  onMapPress?: () => void;
  /** Dispara quando o MapView nativo terminou de inicializar (tiles podem ainda carregar). */
  onMapReady?: () => void;
};

export type RastroNativeMapHandle = {
  focusUser: () => void;
};

/** ~latitudeDelta para enquadrar um raio de `meters` com folga. */
function regionForRadius(lat: number, lng: number, meters: number): Region {
  const latitudeDelta = Math.max((meters * 2.4) / 111_320, 0.003);
  const longitudeDelta = latitudeDelta / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta,
    longitudeDelta,
  };
}

/** Verde-preto alinhado à paleta dark — sem cinza invertido. */
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d1f16" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7FA391" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#07130D" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a3326" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8aa898" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#07130D" }] },
];

function kindColor(kind: RastroMapMarkerKind): string {
  if (kind === "ecoponto") return colors.pinBlue;
  if (kind === "resolvido") return colors.pinGreen;
  return colors.pinRed;
}

function PinMarker({ kind, photoUrl }: { kind: RastroMapMarkerKind; photoUrl?: string }) {
  const bg = kindColor(kind);
  const icon = kind === "ecoponto" ? "recycle" : "trash-can";
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(drop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
  }, [drop]);

  const pinBody =
    photoUrl && kind !== "ecoponto" ? (
      <>
        <View style={[styles.photoPin, { borderColor: bg }]} collapsable={false}>
          <Image source={{ uri: photoUrl }} style={styles.photoImg} contentFit="cover" />
          <View style={[styles.photoBadge, { backgroundColor: bg }]}>
            <MaterialCommunityIcons name="trash-can" size={10} color="#fff" />
          </View>
        </View>
        <View style={[styles.pinTip, { borderTopColor: bg }]} collapsable={false} />
      </>
    ) : (
      <>
        <View style={[styles.pinHead, { backgroundColor: bg }]} collapsable={false}>
          <MaterialCommunityIcons name={icon} size={18} color="#fff" />
        </View>
        <View style={[styles.pinTip, { borderTopColor: bg }]} collapsable={false} />
      </>
    );

  return (
    <Animated.View
      style={[
        styles.pinWrap,
        {
          transform: [
            {
              translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-26, 0] }),
            },
            {
              scale: drop.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.55, 1.08, 1] }),
            },
          ],
        },
      ]}
      collapsable={false}
    >
      {pinBody}
    </Animated.View>
  );
}

export const RastroNativeMap = forwardRef<RastroNativeMapHandle, RastroNativeMapProps>(
  function RastroNativeMap(
    {
      centerLat,
      centerLng,
      markers,
      user,
      selectedId,
      onMarkerPress,
      onMapPress,
      onMapReady,
    },
    ref,
  ) {
    const { colors: theme, isDark } = useRastroTheme();
    const mapRef = useRef<MapView>(null);
    const didInitialFocus = useRef(false);
    const readyOnce = useRef(false);
    const userRef = useRef(user);
    const centerRef = useRef({ lat: centerLat, lng: centerLng });
    const onMapReadyRef = useRef(onMapReady);
    userRef.current = user;
    centerRef.current = { lat: centerLat, lng: centerLng };
    onMapReadyRef.current = onMapReady;

    /** Android precisa de um frame com tracksViewChanges=true para renderizar views custom. */
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    // Monta já na região certa (pai só renderiza o mapa depois de ter loc).
    const initialRegion = useMemo(
      () => regionForRadius(centerLat, centerLng, MAP_RADIUS_M),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        focusUser: () => {
          const target = userRef.current ?? centerRef.current;
          mapRef.current?.animateToRegion(
            regionForRadius(target.lat, target.lng, MAP_RADIUS_M),
            350,
          );
        },
      }),
      [],
    );

    useEffect(() => {
      if (!user || didInitialFocus.current) return;
      didInitialFocus.current = true;
      mapRef.current?.animateToRegion(regionForRadius(user.lat, user.lng, MAP_RADIUS_M), 250);
    }, [user]);

    useEffect(() => {
      setTracksViewChanges(true);
      const t = setTimeout(() => setTracksViewChanges(false), 900);
      return () => clearTimeout(t);
    }, [markers, selectedId]);

    useEffect(() => {
      // Sempre loga no Android release se a key não chegou no binário (mapa cinza).
      if (Platform.OS !== "android") return;
      const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;
      const key =
        extra?.googleMapsApiKey?.trim() ||
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
        "";
      if (!key) {
        console.warn(
          "[RastroMaps] Google Maps API key vazia no binário. Mapa Android fica em branco.",
        );
      }
    }, []);

    const handleMapReady = () => {
      if (readyOnce.current) return;
      readyOnce.current = true;
      requestAnimationFrame(() => {
        setTimeout(() => onMapReadyRef.current?.(), Platform.OS === "ios" ? 300 : 100);
      });
    };

    return (
      <View style={[styles.wrap, { backgroundColor: theme.bg }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          moveOnMarkerPress={false}
          loadingEnabled={false}
          loadingIndicatorColor={theme.cta}
          loadingBackgroundColor={theme.bg}
          userInterfaceStyle={isDark ? "dark" : "light"}
          customMapStyle={isDark ? DARK_MAP_STYLE : []}
          onMapReady={handleMapReady}
          onPress={() => onMapPress?.()}
        >
          {markers.map((m) => {
            const isDenuncia = m.kind !== "ecoponto";
            const zIndex = isDenuncia ? (selectedId === m.id ? 2000 : 1000) : 100;
            return (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.lat, longitude: m.lng }}
                title={m.title}
                tracksViewChanges={tracksViewChanges || selectedId === m.id}
                anchor={{ x: 0.5, y: 1 }}
                zIndex={zIndex}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onMarkerPress?.(m);
                }}
              >
                <PinMarker kind={m.kind} photoUrl={m.photoUrl} />
              </Marker>
            );
          })}
        </MapView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  pinWrap: {
    alignItems: "center",
    width: 44,
    height: 52,
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  photoPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  photoImg: {
    width: "100%",
    height: "100%",
  },
  photoBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
