import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ThemeColors } from "@/constants/colors";
import { fonts, makeTypography } from "@/constants/typography";
import { useThemedStyles } from "@/contexts/ThemeContext";

export default function TermosScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Termos de uso</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Atualizado em agosto de 2026</Text>
        <Text style={styles.lead}>
          Ao usar o Rastro, você concorda com as condições abaixo. O app existe para
          facilitar o registro cidadão de descartes irregulares.
        </Text>

        <Text style={styles.h2}>1. Uso do aplicativo</Text>
        <Text style={styles.p}>
          O Rastro permite enviar registros georreferenciados com fotos para apoiar a
          zeladoria urbana. Use o app de boa-fé, sem enviar conteúdo falso, ofensivo ou
          que viole direitos de terceiros.
        </Text>

        <Text style={styles.h2}>2. Conta e dados</Text>
        <Text style={styles.p}>
          Você pode usar o app de forma anônima. Se criar uma conta, é responsável por
          manter suas credenciais em segurança e por atualizar informações cadastrais.
        </Text>

        <Text style={styles.h2}>3. Conteúdo enviado</Text>
        <Text style={styles.p}>
          Fotos e textos enviados podem ser analisados por sistemas automáticos e
          encaminhados a órgãos competentes. Não envie imagens com pessoas identificáveis
          quando for evitável.
        </Text>

        <Text style={styles.h2}>4. Limitação</Text>
        <Text style={styles.p}>
          O Rastro não substitui canais oficiais de emergência. Em situações de risco
          imediato, acione os serviços públicos apropriados.
        </Text>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  const typography = makeTypography(colors);
  return StyleSheet.create({
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
    ...typography.title,
    fontSize: 17,
    color: "#fff",
  },
  updated: {
    ...typography.data,
    fontSize: 12,
    color: colors.cta,
    marginBottom: 12,
  },
  lead: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 22,
  },
  h2: {
    ...typography.title,
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  p: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 16,
  },
  });
}
