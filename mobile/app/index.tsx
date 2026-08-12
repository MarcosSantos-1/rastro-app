import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { BrandedLoading } from "@/components/BrandedLoading";
import { isOnboardingCompleted } from "@/lib/onboarding";

/** Gate: onboarding uma vez; depois abre nas tabs (Início). */
export default function IndexGate() {
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
    return (
      <View style={{ flex: 1 }}>
        <BrandedLoading visible />
      </View>
    );
  }

  return <Redirect href={done ? "/(tabs)" : "/onboarding"} />;
}
