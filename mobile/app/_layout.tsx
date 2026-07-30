import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandedLoading } from "@/components/BrandedLoading";
import { colors } from "@/constants/colors";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: "#f7f9f8" },
            }}
          />
          <Stack.Screen name="enviado" />
        </Stack>
      </ThemeProvider>
      <BrandedLoading visible={!ready} />
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
