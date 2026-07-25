import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/colors";
import { SafeAreaProvider } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const LOGO_W = Math.min(width * 0.62, 280);

function LoadingOverlay({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const shown = useRef(true);

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
    if (!visible && shown.current) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        shown.current = false;
      });
    }
  }, [visible, opacity]);

  if (!shown.current && !visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={visible ? "auto" : "none"}>
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

function AppShell() {
  const { ready } = useAuth();

  return (
    <>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" translucent={false} backgroundColor={colors.bg} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="mapa" />
          <Stack.Screen
            name="registro"
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="enviado" />
        </Stack>
      </ThemeProvider>
      <LoadingOverlay visible={!ready} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
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
