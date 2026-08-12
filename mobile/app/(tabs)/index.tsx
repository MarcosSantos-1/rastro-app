import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom, 8) + 16;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: fabBottom + 72 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Olá!</Text>
        <Text style={styles.subtitle}>
          Pronto para deixar a cidade um pouco mais limpa hoje?
        </Text>

        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="leaf" size={28} color={colors.cta} />
          </View>
          <Text style={styles.heroTitle}>Seu impacto começa aqui</Text>
          <Text style={styles.heroBody}>
            Registre um descarte irregular em segundos. A IA ajuda a classificar e a
            prefeitura recebe o ponto certo no mapa.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.heroCta, pressed && styles.heroCtaPressed]}
            onPress={() => router.push("/registro")}
          >
            <Ionicons name="camera-outline" size={20} color={colors.ctaText} />
            <Text style={styles.heroCtaText}>Registrar ocorrência</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Atalhos</Text>

        <Pressable
          style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
          onPress={() => router.push("/(tabs)/mapa")}
        >
          <View style={[styles.rowIcon, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
            <Ionicons name="map-outline" size={22} color={colors.pinBlue} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Ver mapa</Text>
            <Text style={styles.rowHint}>Ocorrências e ecopontos perto de você</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
          onPress={() => router.push("/(tabs)/perfil")}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.ctaSoft }]}>
            <Ionicons name="person-outline" size={22} color={colors.cta} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Perfil e ajustes</Text>
            <Text style={styles.rowHint}>Termos, privacidade e preferências</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    maxWidth: 320,
  },
  hero: {
    marginTop: 24,
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.ctaSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  heroCta: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.cta,
    paddingVertical: 14,
    borderRadius: 999,
  },
  heroCtaPressed: {
    backgroundColor: colors.ctaPressed,
  },
  heroCtaText: {
    color: colors.ctaText,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCardPressed: {
    opacity: 0.85,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 12,
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
    shadowColor: colors.cta,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 30,
  },
  fabPressed: {
    backgroundColor: colors.ctaPressed,
  },
});
