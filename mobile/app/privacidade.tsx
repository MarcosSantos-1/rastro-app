import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";

export default function PrivacidadeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacidade</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Atualizado em agosto de 2026</Text>
        <Text style={styles.lead}>
          Tratamos dados com o mínimo necessário para o funcionamento do Rastro e para o
          encaminhamento responsável das ocorrências.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="location" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Localização</Text>
            <Text style={styles.cardBody}>
              Usada para registrar o ponto da ocorrência e mostrar ecopontos próximos.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Fotos</Text>
            <Text style={styles.cardBody}>
              Enviadas para triagem e documentação. Processamos imagens para classificar
              resíduos e reduzir dados sensíveis quando possível.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Conta</Text>
            <Text style={styles.cardBody}>
              Dados de perfil são opcionais. Você pode usar o app sem login e limpar
              informações salvas neste aparelho a qualquer momento.
            </Text>
          </View>
        </View>

        <Text style={styles.h2}>Compartilhamento</Text>
        <Text style={styles.p}>
          Informações da ocorrência podem ser compartilhadas com órgãos públicos
          responsáveis pela zeladoria, sem vender dados pessoais para marketing.
        </Text>

        <Text style={styles.h2}>Seus direitos</Text>
        <Text style={styles.p}>
          Você pode solicitar esclarecimentos sobre o tratamento de dados pelo canal de
          feedback disponível no app.
        </Text>
      </ScrollView>
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
  updated: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.cta,
    marginBottom: 12,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  h2: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 12,
  },
});
