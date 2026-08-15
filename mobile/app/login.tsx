import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ThemeColors } from "@/constants/colors";
import { makeShadows } from "@/constants/shadows";
import { fonts, makeTypography } from "@/constants/typography";
import { useRastroTheme, useThemedStyles } from "@/contexts/ThemeContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useRastroTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);

  const onLogin = () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Login", "Informe e-mail e senha para continuar.");
      return;
    }
    Alert.alert("Em breve", "O login com e-mail estará disponível em breve.");
  };

  const onSocial = (provider: string) => {
    Alert.alert(provider, `Entrar com ${provider} estará disponível em breve.`);
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Entrar</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>
        <Text style={styles.welcome}>Bem-vindo de volta</Text>
        <Text style={styles.hint}>
          Acesse sua conta para salvar ocorrências e preferências neste aparelho.
        </Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Senha</Text>
        <View style={styles.passRow}>
          <TextInput
            style={[styles.input, styles.passInput]}
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPass}
          />
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setShowPass((v) => !v)}
            hitSlop={8}
          >
            <Ionicons
              name={showPass ? "eye-off" : "eye"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              "Esqueceu a senha?",
              "Em breve você poderá redefinir a senha pelo e-mail cadastrado.",
            )
          }
          style={styles.forgotWrap}
        >
          <Text style={styles.forgot}>Esqueceu a senha?</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={onLogin}
        >
          <Text style={styles.primaryBtnText}>Entrar</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou continue com</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            style={({ pressed }) => [styles.socialBtn, pressed && styles.socialPressed]}
            onPress={() => onSocial("Google")}
            accessibilityLabel="Entrar com Google"
          >
            <Ionicons name="logo-google" size={24} color="#EA4335" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.socialBtn, pressed && styles.socialPressed]}
            onPress={() => onSocial("Apple")}
            accessibilityLabel="Entrar com Apple"
          >
            <Ionicons name="logo-apple" size={26} color={isDark ? "#fff" : "#111"} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.socialBtn, pressed && styles.socialPressed]}
            onPress={() => onSocial("X")}
            accessibilityLabel="Entrar com X"
          >
            <Text style={styles.xLogo}>𝕏</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const typography = makeTypography(colors);
  const shadows = makeShadows(colors, isDark);
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.cta,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    ...typography.title,
    fontSize: 18,
    color: "#fff",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  welcome: {
    ...typography.display,
    fontSize: 26,
  },
  hint: {
    marginTop: 8,
    marginBottom: 24,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  passRow: {
    position: "relative",
    justifyContent: "center",
  },
  passInput: {
    paddingRight: 48,
    marginBottom: 6,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: 22,
  },
  forgot: {
    fontFamily: fonts.bodySemi,
    color: colors.cta,
    fontWeight: "600",
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: colors.cta,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnPressed: {
    backgroundColor: colors.ctaPressed,
  },
  primaryBtnText: {
    fontFamily: fonts.bodySemi,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.cardSoft,
  },
  socialPressed: {
    backgroundColor: colors.ctaSoft,
  },
  xLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: isDark ? "#fff" : "#111",
  },
  });
}
