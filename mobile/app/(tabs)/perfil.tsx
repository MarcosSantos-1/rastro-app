import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  label: string;
  hint?: string;
  onPress?: () => void;
  right?: ReactNode;
};

function SettingsRow({ icon, label, hint, onPress, right }: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.cta} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      {content}
    </Pressable>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<OptionalProfile>({});
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as OptionalProfile;
        setProfile(parsed);
        setNome(parsed.nome ?? "");
        setEmail(parsed.email ?? "");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const saveProfile = useCallback(async () => {
    const next = {
      nome: nome.trim() || undefined,
      email: email.trim() || undefined,
    };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
    setEditing(false);
    Alert.alert("Salvo", "Seus dados opcionais foram guardados só neste aparelho.");
  }, [email, nome]);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile({});
    setNome("");
    setEmail("");
    setEditing(false);
  }, []);

  const openPlaceholder = (title: string) => {
    Alert.alert(title, "Em breve disponível nesta versão do app.");
  };

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.screenTitle}>Perfil</Text>
      <Text style={styles.screenHint}>
        Tudo aqui é opcional. Use só se quiser guardar preferências ou consultar depois.
      </Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.cta} />
          </View>
          {editing ? (
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Nome (opcional)</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Como podemos te chamar?"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>E-mail (opcional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="para@exemplo.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.formActions}>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}
                  onPress={() => void saveProfile()}
                >
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </Pressable>
                <Pressable onPress={() => setEditing(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{profile.nome || "Visitante anônimo"}</Text>
              <Text style={styles.userEmail}>
                {profile.email || "Nenhum dado salvo neste aparelho"}
              </Text>
              <View style={styles.profileActions}>
                <Pressable
                  style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setEditing(true)}
                >
                  <Text style={styles.outlineBtnText}>
                    {profile.nome || profile.email ? "Editar dados" : "Salvar meus dados"}
                  </Text>
                </Pressable>
                {profile.nome || profile.email ? (
                  <Pressable onPress={() => void clearProfile()}>
                    <Text style={styles.clearText}>Limpar</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>

        <Text style={styles.section}>Preferências</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="notifications-outline"
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
            icon="language-outline"
            label="Idioma"
            hint="Português (Brasil)"
            onPress={() => openPlaceholder("Idioma")}
          />
          <SettingsRow
            icon="settings-outline"
            label="Configurações"
            hint="Localização, câmera e armazenamento"
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
            icon="document-text-outline"
            label="Termos de uso"
            onPress={() => openPlaceholder("Termos de uso")}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Política de privacidade"
            onPress={() => openPlaceholder("Política de privacidade")}
          />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            label="Enviar feedback"
            hint="Conte o que podemos melhorar"
            onPress={() =>
              void Linking.openURL(
                "mailto:contato@rastro.app?subject=Feedback%20Rastro",
              ).catch(() => openPlaceholder("Feedback"))
            }
          />
          <SettingsRow
            icon="star-outline"
            label="Avaliar o app"
            hint="Rate us na loja"
            onPress={() => openPlaceholder("Avaliar o app")}
          />
          <SettingsRow
            icon="help-circle-outline"
            label="Central de ajuda"
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
            icon="information-circle-outline"
            label="Sobre o Rastro"
            hint={`Versão ${version}`}
            onPress={() =>
              Alert.alert(
                "Rastro",
                "App cidadão para registrar descartes irregulares e apoiar a zeladoria urbana com geolocalização e IA.",
              )
            }
          />
          <SettingsRow
            icon="images-outline"
            label="Ver introdução"
            hint="Mostrar o onboarding de novo"
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  screenHint: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ctaSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  userEmail: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  profileActions: {
    marginTop: 16,
    alignItems: "center",
    gap: 10,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: colors.cta,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  outlineBtnText: {
    color: colors.cta,
    fontWeight: "700",
    fontSize: 14,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    width: "100%",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  formActions: {
    marginTop: 12,
    alignItems: "center",
    gap: 10,
  },
  saveBtn: {
    backgroundColor: colors.cta,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  saveBtnText: {
    color: colors.ctaText,
    fontWeight: "700",
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  group: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.ctaSoft,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.ctaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
});
