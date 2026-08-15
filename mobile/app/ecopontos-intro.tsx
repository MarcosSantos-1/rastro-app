import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ThemeColors } from "@/constants/colors";
import { makeShadows } from "@/constants/shadows";
import { fonts, makeTypography } from "@/constants/typography";
import { useThemedStyles } from "@/contexts/ThemeContext";
import { setEcopontosIntroSeen } from "@/lib/ecopontos-intro";

export default function EcopontosIntroScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [busy, setBusy] = useState(false);

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setEcopontosIntroSeen();
      router.back();
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <View style={styles.root}>
      <Image
        source={require("@/assets/images/onboarding/ecopontos.png")}
        style={styles.bg}
        contentFit="cover"
      />
      <View style={styles.scrim} />

      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/rastro_letter_white_padded.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Ecopontos</Text>
          </View>
          <Text style={styles.title}>Pontos de entrega na cidade</Text>
          <Text style={styles.body}>
            Ecopontos são locais de recebimento de entulhos e materiais. Verifique o
            funcionamento no site da prefeitura ou por meio de canais oficiais.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              pressed && styles.btnPressed,
              busy && styles.btnDisabled,
            ]}
            onPress={() => void finish()}
            disabled={busy}
          >
            <Text style={styles.btnText}>{busy ? "Abrindo…" : "Entendi"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const typography = makeTypography(colors);
  const shadows = makeShadows(colors, isDark);
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 24, 18, 0.2)",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  logo: {
    width: 160,
    height: 42,
    alignSelf: "flex-start",
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 22,
    ...shadows.card,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.pinBlue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    ...typography.eyebrow,
    color: "#fff",
    fontSize: 12,
  },
  title: {
    ...typography.display,
    fontSize: 24,
  },
  body: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
  btn: {
    marginTop: 22,
    backgroundColor: colors.cta,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  btnPressed: {
    backgroundColor: colors.ctaPressed,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    fontFamily: fonts.bodySemi,
    color: colors.ctaText,
    fontSize: 16,
    fontWeight: "600",
  },
  });
}
