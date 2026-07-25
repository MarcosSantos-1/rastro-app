import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { setOnboardingCompleted } from "@/lib/onboarding";

const { width: SCREEN_W } = Dimensions.get("window");

type Slide = {
  key: string;
  title: string;
  body: string;
  pin?: "blue" | "green" | "red";
  hint?: string;
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    title: "Rastro",
    body: "O app que mostra para onde vai o lixo da sua região — e ajuda a Prefeitura a agir mais rápido.",
  },
  {
    key: "why",
    title: "Por que registrar?",
    body: "Cada foto georreferenciada vira um chamado claro para a limpeza urbana. Quanto mais registros honestos, mais a cidade enxerga onde o descarte irregular se concentra.",
    hint: "Arraste para conhecer o mapa →",
  },
  {
    key: "blue",
    title: "Ecoponto",
    body: "Ponto fixo informado pela Prefeitura para entregar recicláveis, entulhos e objetos para descarte. No mapa, aparece em azul.",
    pin: "blue",
  },
  {
    key: "green",
    title: "Ponto verde",
    body: "Descarte já resolvido e removido do local que alguém denunciou. Sinal de que o registro fez diferença.",
    pin: "green",
  },
  {
    key: "red",
    title: "Ponto vermelho",
    body: "Descarte reportado e ainda aguardando remoção. É o chamado ativo perto de você.",
    pin: "red",
  },
  {
    key: "cta",
    title: "Pronto para começar?",
    body: "Vamos pedir acesso à localização e à câmera para você ver o mapa da sua região e registrar problemas com uma foto.",
  },
];

function PinDot({ color }: { color: string }) {
  return <View style={[styles.pin, { backgroundColor: color, borderColor: color }]} />;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(i);
  }, []);

  const goTo = useCallback((i: number) => {
    scrollRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
    setIndex(i);
  }, []);

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await setOnboardingCompleted();
      router.replace("/mapa");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const isFirst = index === 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <View key={s.key} style={[styles.page, { width: SCREEN_W }]}>
            {s.key === "welcome" ? (
              <Image
                source={require("@/assets/images/rastro_logo.png")}
                style={styles.logo}
                contentFit="contain"
              />
            ) : s.pin ? (
              <PinDot
                color={
                  s.pin === "blue" ? colors.pinBlue : s.pin === "green" ? colors.pinGreen : colors.pinRed
                }
              />
            ) : (
              <View style={styles.pinPlaceholder} />
            )}
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
            {s.hint ? <Text style={styles.hint}>{s.hint}</Text> : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {isFirst ? (
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={() => goTo(1)}
          >
            <Text style={styles.btnText}>Começar</Text>
          </Pressable>
        ) : isLast ? (
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, busy && styles.btnDisabled]}
            onPress={() => void finish()}
            disabled={busy}
          >
            <Text style={styles.btnText}>{busy ? "Abrindo…" : "Entrar no mapa"}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={() => goTo(Math.min(index + 1, SLIDES.length - 1))}
          >
            <Text style={styles.btnText}>Continuar</Text>
          </Pressable>
        )}
        {!isFirst && !isLast ? (
          <Text style={styles.swipeHint}>ou arraste para o lado</Text>
        ) : null}
        {isLast ? null : (
          <Text style={styles.slideLabel}>
            {index + 1} / {SLIDES.length}
            {slide.hint && index === 1 ? "" : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 120,
    marginBottom: 28,
  },
  pin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    marginBottom: 28,
  },
  pinPlaceholder: {
    width: 56,
    height: 56,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 14,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textMuted,
    textAlign: "center",
  },
  hint: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: "600",
    color: colors.cta,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#99f6e4",
  },
  dotActive: {
    backgroundColor: colors.cta,
    width: 22,
  },
  actions: {
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  btn: {
    backgroundColor: colors.cta,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
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
    fontSize: 17,
    fontWeight: "700",
  },
  swipeHint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  slideLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
