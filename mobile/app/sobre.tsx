import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";

export default function SobreScreen() {
  const insets = useSafeAreaInsets();
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Sobre o Rastro</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>
        <Image
          source={require("@/assets/images/rastro_letter_padded.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.version}>Versão {version}</Text>
        <Text style={styles.lead}>
          O Rastro ajuda cidadãos a registrar descartes irregulares com foto e
          localização, para que a cidade tenha dados melhores e aja com mais precisão.
        </Text>

        <View style={styles.point}>
          <View style={styles.pointIcon}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
          <Text style={styles.pointText}>Registro rápido com câmera e GPS</Text>
        </View>
        <View style={styles.point}>
          <View style={styles.pointIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <Text style={styles.pointText}>Triagem automática por inteligência artificial</Text>
        </View>
        <View style={styles.point}>
          <View style={styles.pointIcon}>
            <Ionicons name="map" size={18} color="#fff" />
          </View>
          <Text style={styles.pointText}>Mapa com ocorrências e ecopontos próximos</Text>
        </View>

        <Text style={styles.footer}>Feito para deixar um bom rastro na cidade.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.cta,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  logo: {
    width: 220,
    height: 56,
    marginBottom: 10,
  },
  version: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.cta,
    marginBottom: 18,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  footer: {
    marginTop: "auto",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
});
