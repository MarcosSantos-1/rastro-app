import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  CATEGORIA_LABEL,
  HOME_STATUS_LABEL,
  homeStatusBucket,
  type Denuncia,
  type DenunciaCategoria,
} from "@/lib/denuncias";
import { listMinhasDenuncias } from "@/lib/submit-denuncia";

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusCopy(d: Denuncia): string {
  const bucket = homeStatusBucket(d.status);
  return bucket ? HOME_STATUS_LABEL[bucket] : "Descartada";
}

export default function MeusRegistrosScreen() {
  const insets = useSafeAreaInsets();
  const { user, ensureAnonymous } = useAuth();
  const [items, setItems] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Meus registros</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.cta} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={36} color={colors.cta} />
              <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
              <Text style={styles.emptyBody}>
                Quando você registrar uma ocorrência, ela aparece aqui com o status.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.88 }]}
                onPress={() => router.push("/registro")}
              >
                <Ionicons name="camera" size={18} color={colors.ctaText} />
                <Text style={styles.emptyCtaText}>Registrar ocorrência</Text>
              </Pressable>
            </View>
          ) : (
            items.map((d) => {
              const bucket = homeStatusBucket(d.status);
              const chipColor =
                bucket === "resolvido"
                  ? colors.statusGreen
                  : bucket === "em_execucao"
                    ? colors.statusOrange
                    : bucket === "encaminhado"
                      ? colors.statusCyan
                      : colors.textMuted;
              return (
                <View key={d.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>
                      {CATEGORIA_LABEL[d.categoria as DenunciaCategoria] ?? d.categoria}
                    </Text>
                    <View style={[styles.chip, { backgroundColor: chipColor }]}>
                      <Text style={styles.chipText}>{statusCopy(d)}</Text>
                    </View>
                  </View>
                  {d.endereco ? <Text style={styles.cardAddr}>{d.endereco}</Text> : null}
                  <Text style={styles.cardDate}>{formatDate(d.createdAt)}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.cta,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 8,
  },
  emptyBody: {
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
    color: colors.ctaText,
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  cardAddr: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
  },
  cardDate: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
});
