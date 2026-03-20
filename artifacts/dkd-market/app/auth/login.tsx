import React, { useState } from "react";
import Svg, { Path, Line, G } from "react-native-svg";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t.auth.email + " & " + t.auth.password);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.message || t.common.error;
      if (Platform.OS === "web") {
        setError(msg);
      } else {
        Alert.alert(t.common.error, msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const webTopInset = Platform.OS === "web" ? 0 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 40,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
              <G>
                <Path d="M8 3C8 3 8 10 12 12C16 14 16 21 16 21" strokeWidth="2.5" strokeLinecap="round" stroke="white" fill="none" />
                <Path d="M16 3C16 3 16 10 12 12C8 14 8 21 8 21" strokeWidth="2.5" strokeLinecap="round" stroke="white" fill="none" />
                <Line x1="10" y1="6" x2="14" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
                <Line x1="10.5" y1="9" x2="13.5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.85} />
                <Line x1="11" y1="12" x2="13" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="10.5" y1="15" x2="13.5" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.85} />
                <Line x1="10" y1="18" x2="14" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
              </G>
            </Svg>
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>DKD-MARKET</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t.auth.welcomeBack}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.auth.loginSubtitle}</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.email}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-email"
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.password}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="login-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/auth/forgot-password")} style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>{t.auth.forgotPassword}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-submit"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>{t.auth.loginButton}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.auth.noAccount}</Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}> {t.auth.registerButton}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#FF6B00",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 22,
    fontStyle: "italic",
    letterSpacing: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    flex: 1,
  },
  form: {
    gap: 4,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    height: "100%" as any,
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  loginBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  footerLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
