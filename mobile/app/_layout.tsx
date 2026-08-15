import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_900Black,
} from "@expo-google-fonts/archivo";
import { MartianMono_500Medium } from "@expo-google-fonts/martian-mono";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
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
 * Gate enxuto: lê AsyncStorage, manda pra /onboarding se preciso, e libera a UI.
 * Não depende de navState.key (travava no APK) nem de Auth Firebase.
 */
function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [booting, setBooting] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => subscribeOnboarding(setDone), []);

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
      setDone(completed);
      setBooting(false);
      void SplashScreen.hideAsync().catch(() => {});

      if (!completed) {
        try {
          router.replace("/onboarding");
        } catch {
          /* index Redirect cobre */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // Se ainda não completou e ainda não estamos no onboarding, mantém overlay
  // só até a rota chegar (máx ~1s) — nunca infinito.
  const [routeWaitDone, setRouteWaitDone] = useState(false);
  useEffect(() => {
    if (booting || done || pathname === "/onboarding") {
      setRouteWaitDone(true);
      return;
    }
    setRouteWaitDone(false);
    const t = setTimeout(() => setRouteWaitDone(true), 1000);
    return () => clearTimeout(t);
  }, [booting, done, pathname]);

  const showOverlay = booting || (!done && pathname !== "/onboarding" && !routeWaitDone);

  return (
    <>
      {children}
      <BrandedLoading visible={showOverlay} fadeOut={false} />
    </>
  );
}

function AppShell() {
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
    <OnboardingGuard>
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_900Black,
    MartianMono_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RastroThemeProvider>
          <AppShell />
        </RastroThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
