import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@/constants/colors";
import { isOnboardingCompleted } from "@/lib/onboarding";

export default function IndexGate() {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    void isOnboardingCompleted().then(setDone);
  }, []);

  if (done === null) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  if (!done) return <Redirect href="/onboarding" />;
  return <Redirect href="/mapa" />;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
