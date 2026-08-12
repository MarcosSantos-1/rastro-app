import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RastroNativeMap,
  type RastroNativeMapHandle,
  type RastroMapMarker,
} from "@/components/RastroNativeMap";
import { BrandedLoading } from "@/components/BrandedLoading";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { distanceMeters, withTimeout } from "@/lib/geo";
import {
  hasSeenEcopontosIntro,
  setPendingEcoponto,
  takePendingEcoponto,
} from "@/lib/ecopontos-intro";
import { CATEGORIA_LABEL, STATUS_LABEL, type DenunciaCategoria } from "@/lib/denuncias";
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

function formatDate(iso?: string): string {
  if (!iso) return "Data não disponível";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(meters?: number): string | null {
  if (meters == null || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
}

function openGoogleMaps(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  void Linking.openURL(url);
}

function openWaze(lat: number, lng: number) {
  const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  void Linking.openURL(url);
}

function ecoMarkersNear(lat: number, lng: number): RastroMapMarker[] {
  return ECOPONTOS.filter(
    (e) => distanceMeters(lat, lng, e.lat, e.lng) <= ECOPONTO_RADIUS_M,
  ).map((e) => ({
    id: `e-${e.id}`,
    lat: e.lat,
    lng: e.lng,
    kind: "ecoponto" as const,
    title: `Ecoponto ${e.nome}`,
    endereco: e.endereco || e.distrito,
    statusLabel: "Ecoponto",
    categoria: "Ponto de coleta",
    distanceM: distanceMeters(lat, lng, e.lat, e.lng),
  }));
}

async function loadMarkersNear(
  lat: number,
  lng: number,
): Promise<{ markers: RastroMapMarker[]; firestoreOk: boolean }> {
  const ecoMarkers = ecoMarkersNear(lat, lng);
  try {
    const denuncias = await listDenunciasNear(lat, lng, MAP_RADIUS_M);
    const denMarkers: RastroMapMarker[] = denuncias.map((d) => {
      // Pós-IA: validada = ainda pendente no mapa; roteada = resolvido/encaminhado
      const kind = d.status === "roteada" ? "resolvido" : "pendente";
      const categoriaLabel =
        CATEGORIA_LABEL[d.categoria as DenunciaCategoria] ?? d.categoria;
      return {
        id: `d-${d.id}`,
        lat: d.lat,
        lng: d.lng,
        kind,
        title: d.endereco || categoriaLabel,
        photoUrl: d.fotoUrl ?? d.fotoUrls?.[0],
        photoUrls: d.fotoUrls?.length ? d.fotoUrls : d.fotoUrl ? [d.fotoUrl] : undefined,
        categoria: categoriaLabel,
        createdAt: d.createdAt,
        endereco: d.endereco,
        statusLabel: STATUS_LABEL[d.status] ?? d.status,
        distanceM: d.distanceM,
      };
    });
    return { markers: [...ecoMarkers, ...denMarkers], firestoreOk: true };
  } catch {
    return { markers: ecoMarkers, firestoreOk: false };
  }
}

/** 1ª conexão Firestore no iOS costuma falhar; Auth precisa estar pronto antes. */
async function loadMarkersNearWithRetry(
  lat: number,
  lng: number,
  attempts = 3,
): Promise<{ markers: RastroMapMarker[]; firestoreOk: boolean }> {
  let last = await loadMarkersNear(lat, lng);
  for (let i = 1; i < attempts && !last.firestoreOk; i++) {
    await new Promise((r) => setTimeout(r, 900 * i));
    last = await loadMarkersNear(lat, lng);
  }
  return last;
}

async function resolveUserLocation(): Promise<{ lat: number; lng: number }> {
  try {
    // High no iOS às vezes nunca retorna; Balanced + timeout evita loading infinito.
    const pos = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      10_000,
      "GPS",
    );
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      return { lat: last.coords.latitude, lng: last.coords.longitude };
    }
    throw new Error("GPS indisponível");
  }
}

export default function MapaScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<RastroNativeMapHandle>(null);
  const { ensureAnonymous, ready } = useAuth();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  /** Monta o MapView cedo (FALLBACK) para o Google Maps SDK inicializar sob o overlay. */
  const [mapSeed, setMapSeed] = useState<{ lat: number; lng: number }>(FALLBACK);
  const [mapKey, setMapKey] = useState("boot");
  const [markers, setMarkers] = useState<RastroMapMarker[]>([]);
  const [selected, setSelected] = useState<RastroMapMarker | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCount = markers.filter((m) => m.kind === "pendente").length;

  const mapsKeyInBinary = Boolean(
    (
      (Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined)
        ?.googleMapsApiKey ||
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      ""
    ).trim(),
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    setPreviewUri(null);
  }, []);

  const handleMarkerPress = useCallback(async (marker: RastroMapMarker) => {
    if (marker.kind === "ecoponto") {
      const seen = await hasSeenEcopontosIntro();
      if (!seen) {
        setPendingEcoponto(marker);
        router.push("/ecopontos-intro");
        return;
      }
    }
    setSelected(marker);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        await withTimeout(ensureAnonymous(), 12_000, "Auth");
      } catch {
        /* retry Firestore abaixo */
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUserLoc(FALLBACK);
        setMapSeed(FALLBACK);
        setMarkers(ecoMarkersNear(FALLBACK.lat, FALLBACK.lng));
        setError("Permita a localização para ver o mapa da sua região.");
        return;
      }

      let loc: { lat: number; lng: number };
      try {
        loc = await resolveUserLocation();
      } catch {
        loc = FALLBACK;
        setError("Não deu para obter o GPS. Mostrando centro de SP.");
      }

      setUserLoc(loc);
      setMapSeed(loc);
      setMapKey((k) =>
        k === "boot" ? `${loc.lat.toFixed(3)}_${loc.lng.toFixed(3)}` : k,
      );

      const { markers: nextMarkers, firestoreOk } = await loadMarkersNearWithRetry(
        loc.lat,
        loc.lng,
      );
      setMarkers(nextMarkers);
      if (!firestoreOk) {
        setError(
          "Sem conexão com o Firebase no momento. Mapa e ecopontos ok; toque em tentar de novo para os registros.",
        );
      } else if (Platform.OS === "android" && !mapsKeyInBinary) {
        setError(
          "Google Maps: API key ausente neste APK. Rebuild com EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no EAS.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar o mapa");
      setUserLoc((prev) => prev ?? FALLBACK);
      setMarkers((prev) =>
        prev.length ? prev : ecoMarkersNear(FALLBACK.lat, FALLBACK.lng),
      );
    } finally {
      // Não espera onMapReady: no APK Android ele às vezes nunca dispara sob overlay
      // (mapa em branco ≠ loading infinito). Tiles carregam com o MapView já montado.
      setLoading(false);
    }
  }, [ensureAnonymous, mapsKeyInBinary]);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      void refresh();
      const pending = takePendingEcoponto();
      if (pending) setSelected(pending);
    }, [ready, refresh]),
  );

  const kindMeta =
    selected?.kind === "ecoponto"
      ? { color: colors.pinBlue, icon: "recycle" as const, label: "Ecoponto" }
      : selected?.kind === "resolvido"
        ? { color: colors.pinGreen, icon: "trash-can" as const, label: "Resolvido" }
        : { color: colors.pinRed, icon: "trash-can" as const, label: "Pendente" };

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        <RastroNativeMap
          key={mapKey}
          ref={mapRef}
          centerLat={mapSeed.lat}
          centerLng={mapSeed.lng}
          markers={markers}
          user={userLoc}
          selectedId={selected?.id}
          onMarkerPress={(m) => void handleMarkerPress(m)}
          onMapPress={clearSelection}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <View style={styles.brandWrap}>
            <Image
              source={require("@/assets/images/rastro_letter_padded.png")}
              style={styles.brandLetter}
              contentFit="contain"
            />
          </View>
        </View>

        {error && !loading ? (
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

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />

        {selected ? (
          <View>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderLeft}>
                <View style={[styles.statusChip, { backgroundColor: kindMeta.color }]}>
                  <MaterialCommunityIcons name={kindMeta.icon} size={16} color="#fff" />
                  <Text style={styles.statusChipTextOn}>{kindMeta.label}</Text>
                </View>
                {selected.kind === "ecoponto" && formatDistance(selected.distanceM) ? (
                  <View style={styles.distanceChip}>
                    <Ionicons name="navigate" size={14} color={colors.cta} />
                    <Text style={styles.distanceText}>
                      {formatDistance(selected.distanceM)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={clearSelection}
                hitSlop={12}
                accessibilityLabel="Fechar detalhes"
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {selected.kind === "ecoponto" ? (
              <View style={styles.navRow}>
                <Pressable
                  style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
                  onPress={() => openGoogleMaps(selected.lat, selected.lng)}
                  accessibilityLabel="Abrir no Google Maps"
                >
                  <Image
                    source={require("@/assets/images/icons/google-maps.png")}
                    style={styles.navIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.navLabel}>Maps</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
                  onPress={() => openWaze(selected.lat, selected.lng)}
                  accessibilityLabel="Abrir no Waze"
                >
                  <Image
                    source={require("@/assets/images/icons/waze.png")}
                    style={styles.navIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.navLabel}>Waze</Text>
                </Pressable>
              </View>
            ) : null}

            {selected.kind !== "ecoponto" && (selected.photoUrls?.length || selected.photoUrl) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}
              >
                {(selected.photoUrls ?? (selected.photoUrl ? [selected.photoUrl] : [])).map(
                  (uri) => (
                    <Pressable key={uri} onPress={() => setPreviewUri(uri)}>
                      <Image
                        source={{ uri }}
                        style={styles.detailPhoto}
                        contentFit="cover"
                      />
                    </Pressable>
                  ),
                )}
              </ScrollView>
            ) : null}

            <Text style={styles.detailTitle}>
              {selected.kind === "ecoponto"
                ? selected.title
                : selected.categoria || "Ocorrência"}
            </Text>

            <View style={styles.metaList}>
              {selected.endereco || selected.title ? (
                <View style={styles.metaRow}>
                  <View style={[styles.metaIcon, { backgroundColor: colors.cta }]}>
                    <Ionicons name="location" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Localização</Text>
                    <Text style={styles.metaValue}>
                      {selected.endereco || selected.title}
                    </Text>
                  </View>
                </View>
              ) : null}

              {selected.kind !== "ecoponto" ? (
                <View style={styles.metaRow}>
                  <View style={[styles.metaIcon, { backgroundColor: colors.cta }]}>
                    <Ionicons name="calendar" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Registrado em</Text>
                    <Text style={styles.metaValue}>{formatDate(selected.createdAt)}</Text>
                  </View>
                </View>
              ) : null}

              {selected.categoria ? (
                <View style={styles.metaRow}>
                  <View style={[styles.metaIcon, { backgroundColor: colors.cta }]}>
                    <Ionicons name="pricetag" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Categoria</Text>
                    <Text style={styles.metaValue}>{selected.categoria}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
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
        )}
      </View>

      <BrandedLoading visible={loading} />

      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.previewRoot}>
          <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUri(null)} />
          <View style={[styles.previewHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable
              style={styles.previewClose}
              onPress={() => setPreviewUri(null)}
              accessibilityLabel="Fechar foto"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" />
          ) : null}
        </View>
      </Modal>
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
  brandWrap: {
    backgroundColor: "#fafafa",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  brandLetter: {
    width: 148,
    height: 38,
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
    minHeight: 120,
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
    marginBottom: 8,
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
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusChipTextOn: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.ctaSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.cta,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
  },
  navBtnPressed: {
    backgroundColor: colors.ctaSoft,
  },
  navIcon: {
    width: 28,
    height: 28,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRow: {
    gap: 10,
    paddingBottom: 12,
  },
  detailPhoto: {
    width: 112,
    height: 112,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  metaList: {
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  metaValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  previewRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  previewHeader: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
    alignItems: "flex-end",
    paddingHorizontal: 16,
  },
  previewClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "80%",
  },
});
