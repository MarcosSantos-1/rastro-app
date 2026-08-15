import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TypewriterMono } from "@/components/TypewriterMono";
import { type ThemeColors } from "@/constants/colors";
import { fonts, makeTypography } from "@/constants/typography";
import { useThemedStyles } from "@/contexts/ThemeContext";
import { formatProtocol } from "@/lib/format-stamp";

export default function EnviadoScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const protocol = id ? formatProtocol(id) : null;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        },
      ]}
    >
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/onboarding/success.png")}
          style={styles.illustration}
          contentFit="contain"
        />

        <Text style={styles.title}>Ocorrência enviada!</Text>
        {protocol ? <TypewriterMono text={protocol} style={styles.protocol} /> : null}
        <Text style={styles.body}>
          Recebemos seu registro. Nossa IA vai analisar as fotos e, se tudo estiver certo,
          o ponto aparece no mapa. Obrigado por cuidar da sua cidade!
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          onPress={() => router.replace("/registro")}
        >
          <Text style={styles.btnPrimaryText}>Registrar outra ocorrência</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.btnSecondaryText}>Voltar ao início</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  const typography = makeTypography(colors);
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "100%",
    maxWidth: 240,
    aspectRatio: 1,
  },
  title: {
    ...typography.display,
    marginTop: 8,
    fontSize: 24,
    textAlign: "center",
  },
  protocol: {
    ...typography.data,
    marginTop: 12,
    fontSize: 16,
    color: colors.homeFocus,
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
  actions: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: colors.cta,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
  },
  btnPrimaryPressed: {
    backgroundColor: colors.ctaPressed,
  },
  btnPrimaryText: {
    fontFamily: fonts.bodySemi,
    color: colors.ctaText,
    fontSize: 16,
    fontWeight: "600",
  },
  btnSecondary: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnSecondaryPressed: {
    opacity: 0.7,
  },
  btnSecondaryText: {
    fontFamily: fonts.bodySemi,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  });
}
