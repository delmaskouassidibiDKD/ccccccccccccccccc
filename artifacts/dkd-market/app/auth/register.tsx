import React, { useState, useMemo } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const COUNTRIES = [
  { id: 16, name: "Côte d'Ivoire", code: "CI", dial: "+225", maxDigits: 10 },
  { id: 17, name: "Congo (RDC)", code: "CD", dial: "+243", maxDigits: 9 },
  { id: 18, name: "Cameroun", code: "CM", dial: "+237", maxDigits: 9 },
  { id: 19, name: "Mali", code: "ML", dial: "+223", maxDigits: 8 },
  { id: 20, name: "Bénin", code: "BJ", dial: "+229", maxDigits: 8 },
  { id: 21, name: "Sénégal", code: "SN", dial: "+221", maxDigits: 9 },
  { id: 22, name: "Togo", code: "TG", dial: "+228", maxDigits: 8 },
  { id: 23, name: "Guinée", code: "GN", dial: "+224", maxDigits: 9 },
  { id: 24, name: "Burkina Faso", code: "BF", dial: "+226", maxDigits: 8 },
  { id: 25, name: "Gabon", code: "GA", dial: "+241", maxDigits: 8 },
  { id: 26, name: "Congo", code: "CG", dial: "+242", maxDigits: 9 },
  { id: 27, name: "Tchad", code: "TD", dial: "+235", maxDigits: 8 },
  { id: 28, name: "Guinée Bissau", code: "GW", dial: "+245", maxDigits: 7 },
  { id: 29, name: "Niger", code: "NE", dial: "+227", maxDigits: 8 },
  { id: 30, name: "Rép. Centrafricaine", code: "CF", dial: "+236", maxDigits: 8 },
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const passwordStrong = useMemo(() => password.length >= 8, [password]);

  const formValid = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      emailValid &&
      passwordStrong &&
      passwordMatch === true
    );
  }, [fullName, emailValid, passwordStrong, passwordMatch]);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits.length <= selectedCountry.maxDigits) {
      setPhone(digits);
    }
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length > country.maxDigits) {
      setPhone(digits.slice(0, country.maxDigits));
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError(t.auth.fullName);
      return;
    }
    if (!emailValid) {
      setError(t.auth.email);
      return;
    }
    if (!passwordStrong) {
      setError(t.auth.password);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.confirmPassword);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        country_id: selectedCountry.id,
        country_code: selectedCountry.code,
        phone_number: phone.trim() || undefined,
      });
      router.replace({ pathname: "/auth/verify-email", params: { email: email.trim().toLowerCase() } });
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
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 20,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: colors.text }]}>{t.auth.createAccount}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.auth.registerSubtitle}</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.fullName} *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              testID="register-name"
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.email} *</Text>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.backgroundCard, borderColor: colors.border },
            emailTouched && email.length > 0 && !emailValid && styles.inputError,
            emailTouched && emailValid && styles.inputSuccess,
          ]}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(val) => { setEmail(val); if (!emailTouched) setEmailTouched(true); }}
              onBlur={() => setEmailTouched(true)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="register-email"
            />
            {emailTouched && email.length > 0 && (
              <Ionicons
                name={emailValid ? "checkmark-circle" : "close-circle"}
                size={20}
                color={emailValid ? "#4CAF50" : "#FF4444"}
              />
            )}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.country} *</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
            onPress={() => setShowCountryPicker(true)}
            testID="register-country"
          >
            <Ionicons name="globe-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <Text style={[styles.countryText, { color: colors.text }]}>{selectedCountry.name}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.phone}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.dialCode, { color: colors.textSecondary }]}>{selectedCountry.dial}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.phonePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              maxLength={selectedCountry.maxDigits}
              testID="register-phone"
            />
            {phone.length > 0 && (
              <Text style={[styles.charCount, { color: colors.textMuted }]}>{phone.length}/{selectedCountry.maxDigits}</Text>
            )}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.password} *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="register-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthBar, passwordStrong ? styles.strengthGood : styles.strengthWeak]} />
              <Text style={[styles.strengthText, { color: passwordStrong ? "#4CAF50" : "#FF4444" }]}>
                {passwordStrong ? "OK" : `${password.length}/8`}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.auth.confirmPassword} *</Text>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.backgroundCard, borderColor: colors.border },
            confirmPassword.length > 0 && passwordMatch === false && styles.inputError,
            confirmPassword.length > 0 && passwordMatch === true && styles.inputSuccess,
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.auth.confirmPassword}
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              testID="register-confirm-password"
            />
            {confirmPassword.length > 0 && (
              <Ionicons
                name={passwordMatch ? "checkmark-circle" : "close-circle"}
                size={20}
                color={passwordMatch ? "#4CAF50" : "#FF4444"}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: colors.primary }, (!formValid || loading) && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={!formValid || loading}
            testID="register-submit"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>{t.auth.registerButton}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.auth.hasAccount}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.primary }]}> {t.auth.loginButton}</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showCountryPicker} transparent animationType="slide">
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.backgroundElevated, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10 }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t.auth.selectCountry}</Text>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={COUNTRIES}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      { borderBottomColor: colors.border },
                      item.code === selectedCountry.code && styles.countryItemSelected,
                    ]}
                    onPress={() => handleCountrySelect(item)}
                  >
                    <Text style={[styles.countryItemText, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.countryItemDial, { color: colors.textSecondary }]}>{item.dial}</Text>
                    {item.code === selectedCountry.code && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
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
  },
  backBtn: {
    marginBottom: 16,
    width: 40,
  },
  headerArea: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: "500" as const,
    flex: 1,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: {
    borderColor: "#FF4444",
  },
  inputSuccess: {
    borderColor: "#4CAF50",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%" as any,
  },
  eyeBtn: {
    padding: 6,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginRight: 10,
    minWidth: 44,
  },
  charCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  countryText: {
    flex: 1,
    fontSize: 15,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginLeft: 4,
  },
  strengthBar: {
    height: 4,
    width: 60,
    borderRadius: 2,
  },
  strengthGood: {
    backgroundColor: "#4CAF50",
  },
  strengthWeak: {
    backgroundColor: "#FF4444",
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  registerBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  registerBtnDisabled: {
    opacity: 0.5,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  countryItemSelected: {
    backgroundColor: "rgba(255,107,0,0.08)",
  },
  countryItemText: {
    flex: 1,
    fontSize: 15,
  },
  countryItemDial: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginRight: 10,
  },
});
