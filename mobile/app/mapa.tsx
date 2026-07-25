import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RastroLeafletMap,
  type RastroLeafletMapHandle,
  type RastroMapMarker,
} from "@/components/RastroLeafletMap";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { distanceMeters } from "@/lib/geo";
import { isDenunciaAtiva, isDenunciaResolvida } from "@/lib/denuncias";
import { listDenunciasNear, MAP_RADIUS_M } from "@/lib/submit-denuncia";
import ecopontos from "@/assets/data/ecopontos-sp.json";

type Ecoponto = {
  id: string;
  nome: string;
  endereco: string;
  distrito: string;
  lat: number;
  lng: number;
};

const ECOPONTOS = ecopontos as Ecoponto[];
/** Ecopontos próximos o suficiente para serem úteis no mapa (além do raio de denúncias). */
const ECOPONTO_RADIUS_M = 2500;
const FALLBACK = { lat: -23.5505, lng: -46.6333 };

export default function MapaScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<RastroLeafletMapHandle>(null);
  const { ensureAnonymous, ready } = useAuth();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<RastroMapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const center = userLoc ?? FALLBACK;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAnonymous();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permita a localização para ver o mapa da sua região.");
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLoc({ lat, lng });

      const denuncias = await listDenunciasNear(lat, lng, MAP_RADIUS_M);
      const denMarkers: RastroMapMarker[] = denuncias.map((d) => ({
        id: `d-${d.id}`,
        lat: d.lat,
        lng: d.lng,
        kind: isDenunciaResolvida(d.status)
          ? "resolvido"
          : isDenunciaAtiva(d.status)
            ? "pendente"
            : "pendente",
        title: d.endereco || d.categoria,
      }));

      const ecoMarkers: RastroMapMarker[] = ECOPONTOS.filter(
        (e) => distanceMeters(lat, lng, e.lat, e.lng) <= ECOPONTO_RADIUS_M,
      ).map((e) => ({
        id: `e-${e.id}`,
        lat: e.lat,
        lng: e.lng,
        kind: "ecoponto" as const,
        title: `Ecoponto ${e.nome}${e.endereco ? ` — ${e.endereco}` : ""}`,
      }));

      setMarkers([...ecoMarkers, ...denMarkers]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar o mapa");
    } finally {
      setLoading(false);
    }
  }, [ensureAnonymous]);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      void refresh();
    }, [ready, refresh]),
  );

  const legend = useMemo(
    () => (
      <View style={styles.legend}>
        <LegendDot color={colors.pinBlue} label="Ecoponto" />
        <LegendDot color={colors.pinRed} label="Aguardando" />
        <LegendDot color={colors.pinGreen} label="Resolvido" />
      </View>
    ),
    [],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.mapWrap}>
        <RastroLeafletMap
          ref={mapRef}
          centerLat={center.lat}
          centerLng={center.lng}
          bufferM={MAP_RADIUS_M}
          markers={markers}
          user={userLoc}
        />
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.cta} size="large" />
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void refresh()}>
              <Text style={styles.retry}>Tentar de novo</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          style={styles.focusBtn}
          onPress={() => mapRef.current?.focusUser()}
          accessibilityLabel="Centralizar no usuário"
        >
          <Ionicons name="locate" size={22} color={colors.cta} />
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {legend}
        <Text style={styles.hint}>Ocorrências em até {MAP_RADIUS_M} m de você</Text>
        <Pressable
          style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
          onPress={() => router.push("/registro")}
        >
          <Ionicons name="camera" size={24} color={colors.ctaText} />
          <Text style={styles.registerText}>Registrar ocorrência</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mapWrap: {
    flex: 1,
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(240,253,250,0.35)",
  },
  errorBanner: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  retry: {
    color: colors.cta,
    fontWeight: "700",
  },
  focusBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottom: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.cta,
    paddingVertical: 16,
    borderRadius: 14,
  },
  registerBtnPressed: {
    backgroundColor: colors.ctaPressed,
  },
  registerText: {
    color: colors.ctaText,
    fontSize: 17,
    fontWeight: "700",
  },
});
