import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { colors } from "@/constants/colors";

const { width } = Dimensions.get("window");
const LOGO_W = Math.min(width * 0.5, 220);

type Props = {
  visible: boolean;
  /** When false, stays mounted and fades out instead of unmounting immediately. */
  fadeOut?: boolean;
};

/** Full-screen logo + pulsing dots (auth gate & map boot). */
export function BrandedLoading({ visible, fadeOut = true }: Props) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const shown = useRef(visible);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    const makeDotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      );

    const dots = Animated.parallel([
      makeDotAnim(dot1, 0),
      makeDotAnim(dot2, 200),
      makeDotAnim(dot3, 400),
    ]);
    dots.start();

    return () => {
      pulse.stop();
      dots.stop();
    };
  }, [dot1, dot2, dot3, scale]);

  useEffect(() => {
    if (visible) {
      shown.current = true;
      opacity.setValue(1);
      return;
    }
    if (!fadeOut) {
      shown.current = false;
      return;
    }
    if (shown.current) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        shown.current = false;
      });
    }
  }, [visible, fadeOut, opacity]);

  if (!shown.current && !visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Animated.Image
        source={require("@/assets/images/rastro_logo.png")}
        style={[styles.logo, { transform: [{ scale }] }]}
        resizeMode="contain"
      />
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_W * 0.72,
  },
  dotsRow: {
    flexDirection: "row",
    marginTop: 36,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cta,
  },
});
