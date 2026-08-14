import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { clearOnboardingCompleted } from "@/lib/onboarding";

const PROFILE_KEY = "rastro_profile_optional";

type OptionalProfile = {
  nome?: string;
  email?: string;
};

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  label: string;
  hint?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
};

function SettingsRow({ icon, iconBg, label, hint, onPress, right, last }: SettingsRowProps) {
  const content = (
    <>
      <View style={[styles.rowIcon, iconBg ? { backgroundColor: iconBg } : null]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, last && styles.rowLast]}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<OptionalProfile>({});
  const [notifications, setNotifications] = useState(true);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as OptionalProfile;
        setProfile(parsed);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const openPlaceholder = (title: string) => {
    Alert.alert(title, "Em breve disponível nesta versão do app.");
  };

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.cta} />
            </View>
          </View>

          <Text style={styles.userName}>{profile.nome || "Visitante anônimo"}</Text>
          <Text style={styles.userEmail}>
            {profile.email || "Entre para salvar suas ocorrências"}
          </Text>
          <View style={styles.profileActions}>
            <Pressable
              style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.outlineBtnText}>Fazer login</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.section}>Preferências</Text>
          <View style={styles.group}>
            <SettingsRow
              icon="notifications"
              iconBg={colors.statusOrange}
              label="Notificações"
              hint="Avisos sobre status de ocorrências"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.cta }}
                  thumbColor="#fff"
                />
              }
            />
            <SettingsRow
              icon="settings"
              iconBg="#64748b"
              label="Configurações"
              hint="Localização, câmera e armazenamento"
              last
              onPress={() =>
                Alert.alert(
                  "Configurações",
                  "Abra as configurações do sistema para gerenciar permissões do Rastro.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Abrir",
                      onPress: () => void Linking.openSettings(),
                    },
                  ],
                )
              }
            />
          </View>

          <Text style={styles.section}>Suporte e legal</Text>
          <View style={styles.group}>
            <SettingsRow
              icon="document-text"
              iconBg={colors.pinBlue}
              label="Termos de uso"
              onPress={() => router.push("/termos")}
            />
            <SettingsRow
              icon="shield-checkmark"
              iconBg={colors.statusGreen}
              label="Política de privacidade"
              onPress={() => router.push("/privacidade")}
            />
            <SettingsRow
              icon="chatbubbles"
              iconBg={colors.statusCyan}
              label="Enviar feedback"
              hint="Conte o que podemos melhorar"
              onPress={() =>
                void Linking.openURL(
                  "mailto:contato@rastro.app?subject=Feedback%20Rastro",
                ).catch(() => openPlaceholder("Feedback"))
              }
            />
            <SettingsRow
              icon="star"
              iconBg={colors.pinAmber}
              label="Avaliar o app"
              hint="Rate us na loja"
              onPress={() => openPlaceholder("Avaliar o app")}
            />
            <SettingsRow
              icon="help-circle"
              iconBg="#7c3aed"
              label="Central de ajuda"
              last
              onPress={() =>
                void WebBrowser.openBrowserAsync("https://rastro.app").catch(() =>
                  openPlaceholder("Ajuda"),
                )
              }
            />
          </View>

          <Text style={styles.section}>Sobre</Text>
          <View style={styles.group}>
            <SettingsRow
              icon="information-circle"
              iconBg={colors.cta}
              label="Sobre o Rastro"
              hint={`Versão ${version}`}
              onPress={() => router.push("/sobre")}
            />
            <SettingsRow
              icon="images"
              iconBg={colors.statusCyan}
              label="Ver introdução"
              hint="Mostrar o onboarding de novo"
              last
              onPress={() => {
                Alert.alert("Ver introdução", "Deseja ver as telas iniciais outra vez?", [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Ver",
                    onPress: () => {
                      void (async () => {
                        await clearOnboardingCompleted();
                        router.replace("/onboarding");
                      })();
                    },
                  },
                ]);
              }}
            />
          </View>

          <View style={styles.footerBrand}>
            <Image
              source={require("@/assets/images/rastro_letter.png")}
              style={styles.footerLetter}
              contentFit="contain"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.cta,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  userEmail: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  profileActions: {
    marginTop: 18,
    alignItems: "center",
    gap: 12,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  outlineBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  clearText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  group: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.ctaSoft,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  footerBrand: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 0,
  },
  footerLetter: {
    width: 160,
    height: 42,
  },
});
