import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RastroNativeMap,
  type RastroNativeMapHandle,
  type RastroMapMarker,
} from "@/components/RastroNativeMap";
import { BrandedLoading } from "@/components/BrandedLoading";
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
const ECOPONTO_RADIUS_M = 2500;
const FALLBACK = { lat: -23.5505, lng: -46.6333 };

async function loadMarkersNear(lat: number, lng: number): Promise<RastroMapMarker[]> {
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

  return [...ecoMarkers, ...denMarkers];
}

export default function MapaScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<RastroNativeMapHandle>(null);
  const { ensureAnonymous, ready } = useAuth();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<RastroMapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const center = userLoc ?? FALLBACK;
  const activeCount = markers.filter((m) => m.kind === "pendente").length;

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

      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const lat = last.coords.latitude;
        const lng = last.coords.longitude;
        setUserLoc({ lat, lng });
        try {
          setMarkers(await loadMarkersNear(lat, lng));
        } catch {
          /* refine abaixo com GPS atual */
        }
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLoc({ lat, lng });
      setMarkers(await loadMarkersNear(lat, lng));
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

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        <RastroNativeMap
          ref={mapRef}
          centerLat={center.lat}
          centerLng={center.lng}
          markers={markers}
          user={userLoc}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.brandPill}>
            <Image
              source={require("@/assets/images/rastro-logo.png")}
              style={styles.brandLogo}
              contentFit="contain"
            />
            <Text style={styles.brandText}>Rastro</Text>
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBanner, { top: insets.top + 64 }]}>
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

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetLabel}>Ocorrências por perto</Text>
            <Text style={styles.sheetCount}>
              {activeCount} {activeCount === 1 ? "registro ativo" : "registros ativos"}
            </Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.pinRed }]} />
              <Text style={styles.legendText}>Pendente</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.pinGreen }]} />
              <Text style={styles.legendText}>Resolvido</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.pinBlue }]} />
              <Text style={styles.legendText}>Ecoponto</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
          onPress={() => router.push("/registro")}
        >
          <Ionicons name="add" size={22} color={colors.ctaText} />
          <Text style={styles.registerText}>Novo registro</Text>
        </Pressable>
      </View>

      <BrandedLoading visible={loading} />
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
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  brandLogo: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.cta,
  },
  errorBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 20,
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
    right: 20,
    top: "45%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 20,
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sheetCount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  legend: {
    alignItems: "flex-end",
    gap: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.cta,
    paddingVertical: 18,
    borderRadius: 999,
    shadowColor: colors.cta,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  registerBtnPressed: {
    backgroundColor: colors.ctaPressed,
    transform: [{ scale: 0.98 }],
  },
  registerText: {
    color: colors.ctaText,
    fontSize: 16,
    fontWeight: "700",
  },
});
