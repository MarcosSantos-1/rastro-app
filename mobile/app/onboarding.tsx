import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { setOnboardingCompleted } from "@/lib/onboarding";

type Slide = {
  key: string;
  image: ImageSourcePropType;
  title: string;
  description: string;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("screen");

const SLIDES: Slide[] = [
  {
    key: "welcome",
    image: require("@/assets/images/onboarding/welcome.png"),
    title: "Bem-vindo ao Rastro",
    description:
      "O jeito mais simples de cuidar da sua cidade. Juntos deixamos as ruas mais limpas.",
  },
  {
    key: "photo",
    image: require("@/assets/images/onboarding/photo.png"),
    title: "Registre em segundos",
    description:
      "Encontrou lixo descartado no lugar errado? Tire uma foto e pronto: o registro começa aí.",
  },
  {
    key: "location",
    image: require("@/assets/images/onboarding/location1.png"),
    title: "Localização automática",
    description:
      "Capturamos o ponto exato por GPS para que a prefeitura saiba onde agir com precisão.",
  },
  {
    key: "ai",
    image: require("@/assets/images/onboarding/ai.png"),
    title: "Inteligência que ajuda",
    description:
      "Nossa IA identifica o tipo de resíduo e protege sua privacidade borrando rostos e placas.",
  },
  {
    key: "impact",
    image: require("@/assets/images/onboarding/impact.png"),
    title: "Sua cidade agradece",
    description:
      "Cada registro vira dado para decisões públicas melhores. Comece agora a fazer a diferença.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setOnboardingCompleted();
      await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      router.replace("/(tabs)");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (next >= 0 && next < SLIDES.length) setIndex(next);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.bgImage} contentFit="cover" />
        <View style={styles.scrim} />
      </View>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        style={StyleSheet.absoluteFill}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({
          length: SCREEN_W,
          offset: SCREEN_W * i,
          index: i,
        })}
      />

      <View
        style={[styles.overlay, { paddingTop: insets.top + 10 }]}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/rastro_letter_white.png")}
            style={styles.logoLetter}
            contentFit="contain"
          />
          {!isLast ? (
            <Pressable onPress={() => void finish()} hitSlop={12} disabled={busy}>
              <Text style={styles.skip}>Pular</Text>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        {isLast ? (
          <View
            style={[
              styles.lastFooter,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            <Text style={styles.lastTitle}>{slide.title}</Text>
            <Text style={styles.lastBody}>{slide.description}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                pressed && styles.btnPressed,
                busy && styles.btnDisabled,
              ]}
              onPress={() => void finish()}
              disabled={busy}
            >
              <Text style={styles.btnText}>{busy ? "Abrindo…" : "Começar agora"}</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            <View style={styles.dots}>
              {SLIDES.map((s, i) => (
                <View
                  key={s.key}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
            <Text style={styles.cardTitle}>{slide.title}</Text>
            <Text style={styles.cardBody}>{slide.description}</Text>
            <Text style={styles.swipeHint}>Deslize para continuar</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 24, 18, 0.14)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  logoLetter: {
    width: 168,
    height: 44,
  },
  skip: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  skipPlaceholder: {
    width: 48,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 22,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(42, 146, 93, 0.25)",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.cta,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 320,
  },
  swipeHint: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  lastFooter: {
    paddingHorizontal: 28,
  },
  lastTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  lastBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 320,
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
