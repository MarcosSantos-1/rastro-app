import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom, 8) + 16;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 20,
          paddingBottom: fabBottom + 72,
        },
      ]}
    >
      <Text style={styles.greeting}>Olá!</Text>

      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="leaf" size={26} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Seu impacto começa aqui</Text>
        <Text style={styles.heroBody}>
          Registre um descarte irregular em segundos. A IA classifica o resíduo e o ponto
          aparece no mapa da cidade.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.heroCta, pressed && styles.heroCtaPressed]}
          onPress={() => router.push("/registro")}
        >
          <Ionicons name="camera" size={20} color={colors.ctaText} />
          <Text style={styles.heroCtaText}>Registrar ocorrência</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Explorar</Text>

      <Pressable
        style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
        onPress={() => router.push("/(tabs)/mapa")}
      >
        <View style={[styles.rowIcon, { backgroundColor: colors.pinBlue }]}>
          <Ionicons name="map" size={22} color="#fff" />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>Ver mapa</Text>
          <Text style={styles.rowHint}>
            Ocorrências próximas, status e ecopontos de coleta
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
        onPress={() => router.push("/(tabs)/perfil")}
      >
        <View style={[styles.rowIcon, { backgroundColor: colors.cta }]}>
          <Ionicons name="person" size={22} color="#fff" />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>Perfil e ajustes</Text>
          <Text style={styles.rowHint}>
            Dados opcionais, notificações, termos e privacidade
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <View style={styles.footerNote}>
        <Ionicons name="shield-checkmark" size={16} color={colors.cta} />
        <Text style={styles.footerNoteText}>
          Seus registros passam por triagem automática antes de entrar no mapa.
        </Text>
      </View>

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
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },
  hero: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  heroBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  heroCta: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.cta,
    paddingVertical: 15,
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
    gap: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowCardPressed: {
    opacity: 0.88,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  rowHint: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  footerNote: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
