import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";

type Slide = {
  image: ImageSourcePropType;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    image: require("@/assets/images/onboarding/welcome.png"),
    title: "Bem-vindo ao Rastro",
    description:
      "O jeito mais simples de cuidar da sua cidade. Juntos deixamos as ruas mais limpas.",
  },
  {
    image: require("@/assets/images/onboarding/photo.png"),
    title: "Registre em segundos",
    description:
      "Encontrou lixo descartado no lugar errado? Tire uma foto e pronto: o registro começa aí.",
  },
  {
    image: require("@/assets/images/onboarding/location.png"),
    title: "Localização automática",
    description:
      "Capturamos o ponto exato por GPS para que a prefeitura saiba onde agir com precisão.",
  },
  {
    image: require("@/assets/images/onboarding/ai.png"),
    title: "Inteligência que ajuda",
    description:
      "Nossa IA identifica o tipo de resíduo e protege sua privacidade borrando rostos e placas.",
  },
  {
    image: require("@/assets/images/onboarding/impact.png"),
    title: "Sua cidade agradece",
    description:
      "Cada registro vira dado para decisões públicas melhores. Comece agora a fazer a diferença.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      router.replace("/mapa");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const next = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    setIndex((i) => i + 1);
  }, [finish, isLast]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/rastro-logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brandText}>Rastro</Text>
        </View>
        <Pressable onPress={() => void finish()} hitSlop={12} disabled={busy}>
          <Text style={styles.skip}>Pular</Text>
        </Pressable>
      </View>

      <View style={styles.illustrationWrap}>
        <Image source={slide.image} style={styles.illustration} contentFit="contain" />
      </View>

      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.description}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            pressed && styles.btnPressed,
            busy && styles.btnDisabled,
          ]}
          onPress={next}
          disabled={busy}
        >
          <Text style={styles.btnText}>
            {busy ? "Abrindo…" : isLast ? "Começar agora" : "Próximo"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.cta,
  },
  skip: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  illustrationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  illustration: {
    width: "100%",
    maxWidth: 300,
    aspectRatio: 1,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(45, 157, 106, 0.25)",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.cta,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 300,
  },
  btn: {
    marginTop: 24,
    backgroundColor: colors.cta,
    paddingVertical: 18,
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
    color: colors.ctaText,
    fontSize: 16,
    fontWeight: "700",
  },
});
