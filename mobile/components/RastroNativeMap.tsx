import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { colors } from "@/constants/colors";
import { MAP_RADIUS_M } from "@/lib/submit-denuncia";

export type RastroMapMarkerKind = "ecoponto" | "pendente" | "resolvido";

export type RastroMapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: RastroMapMarkerKind;
  title?: string;
};

export type RastroNativeMapProps = {
  centerLat: number;
  centerLng: number;
  markers: RastroMapMarker[];
  user: { lat: number; lng: number } | null;
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

function kindColor(kind: RastroMapMarkerKind): string {
  if (kind === "ecoponto") return colors.pinBlue;
  if (kind === "resolvido") return colors.pinGreen;
  return colors.pinRed;
}

function PinMarker({ kind }: { kind: RastroMapMarkerKind }) {
  const bg = kindColor(kind);
  const icon = kind === "ecoponto" ? "recycle" : "trash-can";
  return (
    <View style={styles.pinWrap} collapsable={false}>
      <View style={[styles.pinHead, { backgroundColor: bg }]} collapsable={false}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
      </View>
      <View style={[styles.pinTip, { borderTopColor: bg }]} collapsable={false} />
    </View>
  );
}

export const RastroNativeMap = forwardRef<RastroNativeMapHandle, RastroNativeMapProps>(
  function RastroNativeMap({ centerLat, centerLng, markers, user }, ref) {
    const mapRef = useRef<MapView>(null);
    const didInitialFocus = useRef(false);
    const userRef = useRef(user);
    const centerRef = useRef({ lat: centerLat, lng: centerLng });
    userRef.current = user;
    centerRef.current = { lat: centerLat, lng: centerLng };

    /** Android precisa de um frame com tracksViewChanges=true para renderizar views custom. */
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    const initialRegion = useMemo(
      () => regionForRadius(centerLat, centerLng, MAP_RADIUS_M),
      // Região inicial só na montagem — evita resetar gestos do usuário
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
      const t = setTimeout(() => setTracksViewChanges(false), 750);
      return () => clearTimeout(t);
    }, [markers]);

    return (
      <View style={styles.wrap}>
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
        >
          {markers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              title={m.title}
              tracksViewChanges={tracksViewChanges}
              anchor={{ x: 0.5, y: 1 }}
            >
              <PinMarker kind={m.kind} />
            </Marker>
          ))}
        </MapView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a" },
  map: { flex: 1 },
  pinWrap: {
    alignItems: "center",
    width: 40,
    height: 48,
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
