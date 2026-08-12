import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, usePathname, useRouter, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandedLoading } from "@/components/BrandedLoading";
import { colors } from "@/constants/colors";
import {
  isOnboardingCompleted,
  subscribeOnboarding,
} from "@/lib/onboarding";
import { SafeAreaProvider } from "react-native-safe-area-context";

function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const navState = useRootNavigationState();
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const completed = await isOnboardingCompleted();
      if (!alive) return;
      setDone(completed);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => subscribeOnboarding(setDone), []);

  useEffect(() => {
    if (!ready || !navState?.key) return;
    if (done) return;
    if (pathname === "/onboarding") return;
    router.replace("/onboarding");
  }, [ready, done, pathname, navState?.key, router]);

  const blocking = !ready || (!done && pathname !== "/onboarding");

  return (
    <>
      {children}
      <BrandedLoading visible={blocking} />
    </>
  );
}

function AppShell() {
  const { ready } = useAuth();

  return (
    <OnboardingGuard>
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
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="login"
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
              contentStyle: { backgroundColor: "#f7f9f8" },
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
      </ThemeProvider>
      <BrandedLoading visible={!ready} />
    </OnboardingGuard>
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
