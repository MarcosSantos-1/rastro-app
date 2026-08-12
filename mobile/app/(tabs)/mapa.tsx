import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

async function loadMarkersNear(lat: number, lng: number): Promise<RastroMapMarker[]> {
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
    };
  });

  const ecoMarkers: RastroMapMarker[] = ECOPONTOS.filter(
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
  }));

  return [...ecoMarkers, ...denMarkers];
}

export default function MapaScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<RastroNativeMapHandle>(null);
  const { ensureAnonymous, ready } = useAuth();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<RastroMapMarker[]>([]);
  const [selected, setSelected] = useState<RastroMapMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const center = userLoc ?? FALLBACK;
  const activeCount = markers.filter((m) => m.kind === "pendente").length;

  const clearSelection = useCallback(() => setSelected(null), []);

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
          ref={mapRef}
          centerLat={center.lat}
          centerLng={center.lng}
          markers={markers}
          user={userLoc}
          selectedId={selected?.id}
          onMarkerPress={setSelected}
          onMapPress={clearSelection}
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

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />

        {selected ? (
          <View>
            <View style={styles.detailHeader}>
              <View style={[styles.statusChip, { backgroundColor: `${kindMeta.color}18` }]}>
                <MaterialCommunityIcons name={kindMeta.icon} size={16} color={kindMeta.color} />
                <Text style={[styles.statusChipText, { color: kindMeta.color }]}>
                  {selected.statusLabel ?? kindMeta.label}
                </Text>
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

            {selected.kind !== "ecoponto" && (selected.photoUrls?.length || selected.photoUrl) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}
              >
                {(selected.photoUrls ?? (selected.photoUrl ? [selected.photoUrl] : [])).map(
                  (uri) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      style={styles.detailPhoto}
                      contentFit="cover"
                    />
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
                  <View style={styles.metaIcon}>
                    <Ionicons name="location-outline" size={18} color={colors.cta} />
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
                  <View style={styles.metaIcon}>
                    <Ionicons name="calendar-outline" size={18} color={colors.cta} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Registrado em</Text>
                    <Text style={styles.metaValue}>{formatDate(selected.createdAt)}</Text>
                  </View>
                </View>
              ) : null}

              {selected.categoria ? (
                <View style={styles.metaRow}>
                  <View style={styles.metaIcon}>
                    <Ionicons name="pricetag-outline" size={18} color={colors.cta} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Categoria</Text>
                    <Text style={styles.metaValue}>{selected.categoria}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <View style={styles.metaIcon}>
                  <MaterialCommunityIcons
                    name={kindMeta.icon}
                    size={18}
                    color={kindMeta.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <Text style={styles.metaValue}>
                    {selected.statusLabel ?? kindMeta.label}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable onPress={clearSelection} style={styles.dismissHint}>
              <Text style={styles.dismissHintText}>Toque fora ou no X para fechar</Text>
            </Pressable>
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
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "700",
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
    backgroundColor: colors.ctaSoft,
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
  dismissHint: {
    marginTop: 14,
    alignItems: "center",
  },
  dismissHintText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
