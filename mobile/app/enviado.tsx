import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";

export default function EnviadoScreen() {
  const insets = useSafeAreaInsets();
  const { municipio } = useLocalSearchParams<{ municipio?: string }>();
  const prefeitura =
    municipio && municipio !== "local"
      ? `Prefeitura de ${municipio}`
      : "Prefeitura local";

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 40,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={88} color={colors.pinGreen} />
        </View>
        <Text style={styles.title}>Enviado</Text>
        <Text style={styles.sub}>Encaminhado para a {prefeitura}</Text>
        <Text style={styles.body}>
          Seu registro fortalece o direito de viver em uma cidade limpa. Cada denúncia
          responsável ajuda a priorizar a remoção de resíduos e a proteger drenagem, rios e
          espaços públicos. Obrigado por contribuir.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={() => router.replace("/mapa")}
      >
        <Text style={styles.btnText}>Ver no mapa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  sub: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.cta,
    textAlign: "center",
  },
  body: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: "center",
  },
  btn: {
    backgroundColor: colors.cta,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPressed: {
    backgroundColor: colors.ctaPressed,
  },
  btnText: {
    color: colors.ctaText,
    fontSize: 18,
    fontWeight: "700",
  },
});
