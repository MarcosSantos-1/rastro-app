import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MeshSkeleton } from "@/components/MeshSkeleton";
import { NewOccurrenceFab } from "@/components/NewOccurrenceFab";
import { PhotoStamp } from "@/components/PhotoStamp";
import { StatusBucketIcon } from "@/components/StatusBucketIcon";
import { StatusRoute } from "@/components/StatusRoute";
import { type ThemeColors } from "@/constants/colors";
import { makeShadows } from "@/constants/shadows";
import { fonts, makeTypography } from "@/constants/typography";
import { useAuth } from "@/contexts/AuthContext";
import { useRastroTheme, useThemedStyles } from "@/contexts/ThemeContext";
import {
  CATEGORIA_LABEL,
  HOME_STATUS_LABEL,
  homeStatusBucket,
  type Denuncia,
  type DenunciaCategoria,
  type HomeStatusBucket,
} from "@/lib/denuncias";
import { formatPhotoStamp } from "@/lib/format-stamp";
import { hapticResolved } from "@/lib/haptics";
import { listMinhasDenuncias } from "@/lib/submit-denuncia";

function formatRelativeDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function statusCopy(d: Denuncia): { bucket: HomeStatusBucket | null; label: string; discarded: boolean } {
  const discarded = d.status === "descartada";
  const bucket = homeStatusBucket(d.status);
  return {
    bucket,
    discarded,
    label: discarded ? "Descartada" : bucket ? HOME_STATUS_LABEL[bucket] : "Descartada",
  };
}

function locationCopy(d: Denuncia): string {
  return d.endereco?.trim() || d.bairro?.trim() || d.municipio?.trim() || "Localização indisponível";
}

function photosOf(d: Denuncia): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...(d.fotoUrls ?? []), d.fotoUrl]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

type ViewerState = { uris: string[]; index: number };

function FeedCard({
  item,
  photoWidth,
  onOpenPhoto,
}: {
  item: Denuncia;
  photoWidth: number;
  onOpenPhoto: (uris: string[], index: number) => void;
}) {
  const { bucket, label, discarded } = statusCopy(item);
  const photos = photosOf(item);
  const categoria = CATEGORIA_LABEL[item.categoria as DenunciaCategoria] ?? item.categoria;
  const observacao = item.observacao?.trim() ?? "";
  const [page, setPage] = useState(0);
  const { colors } = useRastroTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      {photos.length === 0 ? (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={36} color={colors.textMuted} />
          <Text style={styles.photoPlaceholderText}>Foto em processamento</Text>
        </View>
      ) : photos.length === 1 ? (
        <Pressable style={styles.photoWrap} onPress={() => onOpenPhoto(photos, 0)} accessibilityLabel="Ver foto">
          <Image source={{ uri: photos[0] }} style={[styles.photo, { width: photoWidth }]} contentFit="cover" />
          <PhotoStamp
            text={formatPhotoStamp(
              item.createdAt ? new Date(item.createdAt) : new Date(),
              item.lat,
              item.lng,
            )}
          />
        </Pressable>
      ) : (
        <View style={styles.photoWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / photoWidth);
              setPage(next);
            }}
          >
            {photos.map((uri, index) => (
              <Pressable
                key={`${item.id}-${uri}-${index}`}
                onPress={() => onOpenPhoto(photos, index)}
                accessibilityLabel={`Ver foto ${index + 1}`}
              >
                <Image source={{ uri }} style={[styles.photo, { width: photoWidth }]} contentFit="cover" />
                <PhotoStamp
                  text={formatPhotoStamp(
                    item.createdAt ? new Date(item.createdAt) : new Date(),
                    item.lat,
                    item.lng,
                  )}
                />
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.dots} pointerEvents="none">
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View style={styles.statusWrap}>
            {discarded ? (
              <Ionicons name="ban" size={20} color={colors.danger} />
            ) : bucket ? (
              <StatusBucketIcon bucket={bucket} size={22} />
            ) : null}
            <Text style={[styles.statusLabel, discarded && styles.statusDiscarded]}>{label}</Text>
          </View>
          <Text style={styles.time}>{formatRelativeDate(item.createdAt)}</Text>
        </View>

        <StatusRoute bucket={bucket} discarded={discarded} />

        <Text style={styles.caption}>{categoria}</Text>

        {observacao ? <Text style={styles.observacao}>{observacao}</Text> : null}

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.cta} />
          <Text style={styles.location} numberOfLines={2}>
            {locationCopy(item)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PhotoViewer({
  viewer,
  onClose,
}: {
  viewer: ViewerState | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const startX = (viewer?.index ?? 0) * width;
  const styles = useThemedStyles(createStyles);

  if (!viewer) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerRoot}>
        <ScrollView
          key={`${viewer.index}:${viewer.uris.join("|")}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: startX, y: 0 }}
        >
          {viewer.uris.map((uri, index) => (
            <Pressable key={`${uri}-${index}`} style={{ width, height }} onPress={onClose}>
              <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={[styles.viewerClose, { top: insets.top + 8 }]}
          onPress={onClose}
          accessibilityLabel="Fechar"
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

export default function AtividadeScreen() {
  const { colors } = useRastroTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const photoWidth = width - 32;
  const { user, ensureAnonymous } = useAuth();
  const [items, setItems] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const seenResolved = useRef<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        try {
          const u = user ?? (await ensureAnonymous());
          const uid = u?.uid;
          if (!uid) {
            if (alive) setItems([]);
            return;
          }
          const list = await listMinhasDenuncias(uid);
          if (alive) setItems(list);
        } catch {
          if (alive) setItems([]);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [ensureAnonymous, user]),
  );

  const openPhoto = useCallback((uris: string[], index: number) => {
    setViewer({ uris, index });
  }, []);

  useEffect(() => {
    let fresh = false;
    for (const d of items) {
      if (homeStatusBucket(d.status) !== "resolvido") continue;
      if (seenResolved.current.size > 0 && !seenResolved.current.has(d.id)) fresh = true;
      seenResolved.current.add(d.id);
    }
    if (fresh) hapticResolved();
  }, [items]);

  const showFab = !loading && items.length > 0;
  const listPad = useMemo(
    () => ({
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: Math.max(insets.bottom, 16) + (showFab ? 88 : 24),
      flexGrow: 1 as const,
    }),
    [insets.bottom, showFab],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Atividade</Text>
        <Text style={styles.headerHint}>O histórico das suas ocorrências</Text>
      </View>

      {loading ? (
        <MeshSkeleton />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <FeedCard item={item} photoWidth={photoWidth} onOpenPhoto={openPhoto} />
          )}
          contentContainerStyle={listPad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={40} color={colors.cta} />
              <Text style={styles.emptyTitle}>Nenhuma atividade ainda</Text>
              <Text style={styles.emptyBody}>
                Quando você registrar uma ocorrência, a foto, o status e o local aparecem aqui.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.88 }]}
                onPress={() => router.push("/registro")}
              >
                <Ionicons name="camera" size={18} color={colors.ctaText} />
                <Text style={styles.emptyCtaText}>Registrar ocorrência</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {showFab ? <NewOccurrenceFab /> : null}

      <PhotoViewer viewer={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const typography = makeTypography(colors);
  const shadows = makeShadows(colors, isDark);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 2,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 26,
  },
  headerHint: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    marginTop: 8,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.cta,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyCtaText: {
    fontFamily: fonts.bodySemi,
    color: colors.ctaText,
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  photoWrap: {
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.ctaSoft,
  },
  photoPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.ctaSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  photoPlaceholderText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    backgroundColor: "#fff",
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  statusLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  statusDiscarded: {
    color: colors.danger,
  },
  time: {
    ...typography.data,
    fontSize: 12,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  observacao: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  location: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  viewerClose: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  });
}
