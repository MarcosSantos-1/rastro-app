import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeMiniMap, type HomeMiniMapDot } from "@/components/HomeMiniMap";
import { ScreenBackground } from "@/components/ScreenBackground";
import { StatusBucketIcon } from "@/components/StatusBucketIcon";
import { type ThemeColors } from "@/constants/colors";
import { makeShadows } from "@/constants/shadows";
import { fonts, makeTypography } from "@/constants/typography";
import { useAuth } from "@/contexts/AuthContext";
import { useRastroTheme } from "@/contexts/ThemeContext";
import { homeStatusBucket } from "@/lib/denuncias";
import { distanceMeters, withTimeout } from "@/lib/geo";
import { listDenunciasNear, listMinhasDenuncias, MAP_RADIUS_M } from "@/lib/submit-denuncia";
import ecopontos from "@/assets/data/ecopontos-sp.json";

type Ecoponto = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
};

const ECOPONTOS = ecopontos as Ecoponto[];
const ECOPONTO_RADIUS_M = 2500;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const MOCK_NOTIFS = [
  {
    id: "1",
    title: "Ocorrência publicada",
    body: "Seu registro foi validado e já aparece no mapa da cidade.",
    time: "Há 2 h",
  },
  {
    id: "2",
    title: "Encaminhada à prefeitura",
    body: "A ouvidoria recebeu a ocorrência da Rua das Palmeiras.",
    time: "Ontem",
  },
  {
    id: "3",
    title: "Ecoponto próximo",
    body: "Há um ponto de coleta a menos de 1 km de você.",
    time: "Há 3 dias",
  },
];

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useRastroTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const scrollRef = useRef<ScrollView>(null);
  const { user, ensureAnonymous } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [counts, setCounts] = useState({ encaminhados: 0, emExecucao: 0, resolvidos: 0 });
  const [nearbyOcc, setNearbyOcc] = useState(0);
  const [nearbyEco, setNearbyEco] = useState(0);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [miniDots, setMiniDots] = useState<HomeMiniMapDot[]>([]);
  const fabBottom = 16;

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useEffect(() => {
    const nav = navigation as unknown as {
      addListener: (event: "tabPress", cb: () => void) => () => void;
    };
    return nav.addListener("tabPress", scrollToTop);
  }, [navigation, scrollToTop]);

  useFocusEffect(
    useCallback(() => {
      scrollToTop();
      let alive = true;
      void (async () => {
        let uid = user?.uid;
        try {
          const session = await ensureAnonymous();
          uid = session.uid;
        } catch {
          /* mapa / registro tentam de novo */
        }
        if (uid) {
          try {
            const mine = await listMinhasDenuncias(uid);
            if (!alive) return;
            let encaminhados = 0;
            let emExecucao = 0;
            let resolvidos = 0;
            for (const d of mine) {
              const bucket = homeStatusBucket(d.status);
              if (bucket === "encaminhado") encaminhados += 1;
              else if (bucket === "em_execucao") emExecucao += 1;
              else if (bucket === "resolvido") resolvidos += 1;
            }
            setCounts({ encaminhados, emExecucao, resolvidos });
          } catch {
            if (alive) setCounts({ encaminhados: 0, emExecucao: 0, resolvidos: 0 });
          }
        }

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") return;
          const pos = await withTimeout(
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            8_000,
            "GPS",
          ).catch(async () => {
            const last = await Location.getLastKnownPositionAsync();
            if (!last) throw new Error("GPS indisponível");
            return last;
          });
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (!alive) return;
          setUserLoc({ lat, lng });

          const ecos = ECOPONTOS.filter(
            (e) => distanceMeters(lat, lng, e.lat, e.lng) <= ECOPONTO_RADIUS_M,
          );
          setNearbyEco(ecos.length);

          const denuncias = await listDenunciasNear(lat, lng, MAP_RADIUS_M);
          if (!alive) return;
          const cutoff = Date.now() - SEVEN_DAYS_MS;
          const recent = denuncias.filter((d) => {
            const t = new Date(d.createdAt).getTime();
            return Number.isFinite(t) && t >= cutoff;
          });
          setNearbyOcc(recent.length);

          const occDots: HomeMiniMapDot[] = denuncias.slice(0, 12).map((d) => ({
            id: `d-${d.id}`,
            lat: d.lat,
            lng: d.lng,
            kind: "ocorrencia" as const,
          }));
          const ecoDots: HomeMiniMapDot[] = ecos.slice(0, 8).map((e) => ({
            id: `e-${e.id}`,
            lat: e.lat,
            lng: e.lng,
            kind: "ecoponto" as const,
          }));
          setMiniDots([...occDots, ...ecoDots]);
        } catch {
          if (alive) {
            setNearbyOcc(0);
            setNearbyEco(0);
            setMiniDots([]);
          }
        }
      })();
      return () => {
        alive = false;
      };
    }, [ensureAnonymous, user?.uid, scrollToTop]),
  );

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Image
          source={
            isDark
              ? require("@/assets/images/rastro_letter_white.png")
              : require("@/assets/images/rastro_letter.png")
          }
          style={styles.letterLogo}
          contentFit="contain"
          accessibilityLabel="Rastro"
        />
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            onPress={() => setNotifOpen(true)}
            accessibilityLabel="Notificações"
          >
            <Ionicons name="notifications" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            onPress={() => router.push("/perfil")}
            accessibilityLabel="Meu perfil"
          >
            <Ionicons name="person" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: fabBottom + 80,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.hero}
          onPress={() => router.push("/registro")}
          accessibilityLabel="Registrar ocorrência"
        >
          <Image
            source={require("@/assets/images/main_page_card.png")}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroIconWrap}>
            <Ionicons name="leaf" size={22} color="#fff" />
          </View>
          <View style={styles.heroCamBtn}>
            <Ionicons name="camera" size={19} color={colors.cta} />
          </View>
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Meus registros</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/atividade")}
            hitSlop={8}
            accessibilityLabel="Ver todos os registros"
          >
            <Text style={styles.verTodos}>Ver todos &gt;</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <View style={styles.statIcon}>
              <StatusBucketIcon bucket="encaminhado" size={32} />
            </View>
            <Text style={styles.statNum}>{counts.encaminhados}</Text>
            <Text style={styles.statLabel}>Encaminhados</Text>
          </View>
          <View style={styles.statCol}>
            <View style={styles.statIcon}>
              <StatusBucketIcon bucket="em_execucao" size={32} />
            </View>
            <Text style={styles.statNum}>{counts.emExecucao}</Text>
            <Text style={styles.statLabel}>Em execução</Text>
          </View>
          <View style={styles.statCol}>
            <View style={styles.statIcon}>
              <StatusBucketIcon bucket="resolvido" size={32} />
            </View>
            <Text style={styles.statNum}>{counts.resolvidos}</Text>
            <Text style={styles.statLabel}>Resolvidos</Text>
          </View>
        </View>

        <View style={styles.nearRow}>
          <Pressable
            style={({ pressed }) => [styles.nearCard, styles.nearLeft, pressed && styles.cardPressed]}
            onPress={() => router.push("/(tabs)/mapa")}
          >
            <Text style={styles.nearTitle}>Perto de você</Text>
            <View style={styles.nearLine}>
              <View style={styles.nearIcon}>
                <Ionicons name="location" size={18} color="#fff" />
              </View>
              <View style={styles.nearCopy}>
                <Text style={styles.nearCount}>
                  {nearbyOcc} {nearbyOcc === 1 ? "Ocorrência" : "Ocorrências"}
                </Text>
                <Text style={styles.nearHint}>nos últimos 7 dias</Text>
              </View>
            </View>
            <View style={styles.nearLine}>
              <View style={[styles.nearIcon, { backgroundColor: colors.pinBlue }]}>
                <MaterialCommunityIcons name="recycle" size={18} color="#fff" />
              </View>
              <View style={styles.nearCopy}>
                <Text style={styles.nearCount}>
                  {nearbyEco} {nearbyEco === 1 ? "ecoponto" : "ecopontos"}
                </Text>
                <Text style={styles.nearHint}>próximos a você</Text>
              </View>
            </View>
          </Pressable>

          <View style={[styles.nearCard, styles.nearRight]}>
            <HomeMiniMap center={userLoc} user={userLoc} dots={miniDots} />
            <View style={styles.verMapaChip} pointerEvents="none">
              <Ionicons name="map" size={14} color={colors.cta} />
              <Text style={styles.verMapaText}>Ver no mapa</Text>
            </View>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => router.push("/(tabs)/mapa")}
              accessibilityLabel="Ver no mapa"
            />
          </View>
        </View>

        <View style={styles.bannerWrap}>
          <Image
            source={require("@/assets/images/main_page_cardII.png")}
            style={styles.bannerImage}
            contentFit="cover"
          />
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: fabBottom },
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push("/registro")}
        accessibilityLabel="Adicionar ocorrência"
      >
        <Ionicons name="add" size={30} color={colors.ctaText} />
      </Pressable>

      <Modal
        visible={notifOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setNotifOpen(false)} />
          <View style={[styles.notifSheet, { marginTop: insets.top + 64 }]}>
            <View style={styles.notifHead}>
              <Text style={styles.notifTitle}>Notificações</Text>
              <Pressable onPress={() => setNotifOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            {MOCK_NOTIFS.map((n, i) => (
              <View
                key={n.id}
                style={[styles.notifItem, i === MOCK_NOTIFS.length - 1 && styles.notifItemLast]}
              >
                <View style={styles.notifDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifItemTitle}>{n.title}</Text>
                  <Text style={styles.notifItemBody}>{n.body}</Text>
                  <Text style={styles.notifItemTime}>{n.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const typography = makeTypography(colors);
  const shadows = makeShadows(colors, isDark);
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  letterLogo: {
    width: 188,
    height: 46,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSoft,
  },
  headerBtnPressed: {
    opacity: 0.82,
  },
  hero: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.bgElevated,
    ...shadows.card,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1.85,
  },
  heroIconWrap: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 41,
    height: 41,
    borderRadius: 12,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCamBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 41,
    height: 41,
    borderRadius: 21,
    backgroundColor: isDark ? colors.bg : "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.cardSoft,
  },
  sectionHead: {
    marginTop: 22,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
  },
  verTodos: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontWeight: "600",
    color: colors.cta,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.card,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    ...typography.data,
    fontSize: 20,
  },
  statLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  nearRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 14,
  },
  nearCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  nearLeft: {
    flex: 1.15,
    padding: 14,
    gap: 14,
  },
  nearRight: {
    flex: 1,
    minHeight: 168,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cardPressed: {
    opacity: 0.9,
  },
  nearTitle: {
    ...typography.title,
    fontSize: 15,
  },
  nearLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nearIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  nearCopy: {
    flex: 1,
  },
  nearCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  nearHint: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    opacity: 0.75,
  },
  verMapaChip: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: isDark ? "rgba(7,19,13,0.92)" : "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verMapaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    fontWeight: "600",
    color: colors.cta,
  },
  bannerWrap: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.bgElevated,
    ...shadows.card,
  },
  bannerImage: {
    width: "100%",
    aspectRatio: 2.15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    paddingHorizontal: 16,
  },
  notifSheet: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: 16,
    maxHeight: "70%",
    zIndex: 2,
    ...shadows.card,
  },
  notifHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  notifTitle: {
    ...typography.title,
    fontSize: 17,
  },
  notifItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  notifItemLast: {
    borderBottomWidth: 0,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cta,
    marginTop: 6,
  },
  notifItemTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  notifItemBody: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  notifItemTime: {
    ...typography.data,
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.fab,
    zIndex: 30,
  },
  fabPressed: {
    backgroundColor: colors.ctaPressed,
  },
  });
}
