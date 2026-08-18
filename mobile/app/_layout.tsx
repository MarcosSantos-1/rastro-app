import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_900Black,
} from "@expo-google-fonts/archivo";
import { MartianMono_500Medium } from "@expo-google-fonts/martian-mono";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { RastroThemeProvider, useRastroTheme } from "@/contexts/ThemeContext";
import { BrandedLoading } from "@/components/BrandedLoading";
import {
  isOnboardingCompleted,
  subscribeOnboarding,
} from "@/lib/onboarding";
import { SafeAreaProvider } from "react-native-safe-area-context";

void SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Stack sempre montado. Overlay cobre até a rota certa existir.
 * O replace só roda depois que o navigator tem key — senão o loading fica eterno.
 */
function OnboardingGuard({
  children,
  onOverlayChange,
}: {
  children: ReactNode;
  onOverlayChange: (visible: boolean) => void;
}) {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const [gate, setGate] = useState<"loading" | "onboarding" | "app">("loading");

  useEffect(
    () =>
      subscribeOnboarding((completed) => {
        setGate(completed ? "app" : "onboarding");
      }),
    [],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      let completed = false;
      try {
        completed = await isOnboardingCompleted();
      } catch {
        completed = false;
      }
      if (!alive) return;
      setGate(completed ? "app" : "onboarding");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const navReady = Boolean(navState?.key);
  const onOnboarding = segments[0] === "onboarding";

  useEffect(() => {
    if (!navReady || gate === "loading") return;
    if (gate === "onboarding" && !onOnboarding) {
      router.replace("/onboarding");
    }
  }, [navReady, gate, onOnboarding, router]);

  const showOverlay = gate === "loading" || (gate === "onboarding" && !onOnboarding);

  useEffect(() => {
    onOverlayChange(showOverlay);
  }, [showOverlay, onOverlayChange]);

  return <>{children}</>;
}

function AppShell({ onGateOverlayChange }: { onGateOverlayChange: (visible: boolean) => void }) {
  const { colors, isDark } = useRastroTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.bgElevated,
      primary: colors.cta,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <OnboardingGuard onOverlayChange={onGateOverlayChange}>
      <ThemeProvider value={navTheme}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style={isDark ? "light" : "dark"} translucent={false} backgroundColor={colors.bg} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="ecopontos-intro"
              options={{
                presentation: "fullScreenModal",
                animation: "fade",
              }}
            />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="login"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="perfil"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen name="termos" />
            <Stack.Screen name="privacidade" />
            <Stack.Screen name="sobre" />
            <Stack.Screen
              name="registro"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
                contentStyle: { backgroundColor: colors.bg },
              }}
            />
            <Stack.Screen
              name="enviado"
              options={{
                presentation: "fullScreenModal",
                animation: "fade",
              }}
            />
          </Stack>
        </View>
      </ThemeProvider>
    </OnboardingGuard>
  );
}

function RootBoot({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { colors } = useRastroTheme();
  const [gateOverlay, setGateOverlay] = useState(true);

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppShell onGateOverlayChange={setGateOverlay} />
      <BrandedLoading
        visible={!fontsLoaded || gateOverlay}
        fadeOut={false}
        backgroundColor="#FFFFFF"
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_900Black,
    MartianMono_500Medium,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RastroThemeProvider>
          <RootBoot fontsLoaded={fontsLoaded} />
        </RastroThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
