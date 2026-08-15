import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { makeShadows } from "@/constants/shadows";
import { useRastroTheme } from "@/contexts/ThemeContext";

export function NewOccurrenceFab({ bottom = 16 }: { bottom?: number }) {
  const { colors, isDark } = useRastroTheme();
  const shadows = makeShadows(colors, isDark);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        shadows.fab,
        {
          bottom,
          backgroundColor: pressed ? colors.ctaPressed : colors.cta,
        },
      ]}
      onPress={() => router.push("/registro")}
      accessibilityLabel="Adicionar ocorrência"
    >
      <Ionicons name="add" size={30} color={colors.ctaText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
});
