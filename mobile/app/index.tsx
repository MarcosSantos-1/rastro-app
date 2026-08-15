import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRastroTheme } from "@/contexts/ThemeContext";
import { isOnboardingCompleted } from "@/lib/onboarding";

/**
 * Gate mínimo: fundo sólido enquanto lê o storage.
 * O overlay do root (_layout) cobre qualquer flash — aqui não montamos as tabs
 * até saber se o onboarding já foi feito.
 */
export default function IndexGate() {
  const { colors } = useRastroTheme();
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

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return <Redirect href={done ? "/(tabs)" : "/onboarding"} />;
}
