import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRastroTheme } from "@/contexts/ThemeContext";
import { isOnboardingCompleted } from "@/lib/onboarding";

/**
 * Só redireciona depois de ler o storage. O overlay do root cobre este vazio.
 */
export default function IndexGate() {
  const { colors } = useRastroTheme();
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

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
