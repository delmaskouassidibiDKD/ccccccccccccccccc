import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { user, logout, updateUser } = useAuth();

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { data: configData } = useQuery({
    queryKey: ["/api/config/public"],
  });

  const countries = (configData as any)?.countries || [];
  const currentCountry = countries.find((c: any) => c.id === user?.country_id);

  const languageLabel = language === "fr" ? "Français" : language === "en" ? "English" : "日本語";

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(t.common.error, t.common.error);
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert(t.common.error, t.common.error);
      return;
    }
    if (newPassword.length < 6) {
      showAlert(t.common.error, t.common.error);
      return;
    }

    setPasswordLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      showAlert(t.settings.changePassword, "");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      showAlert(t.common.error, e?.message || t.common.error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace("/auth/login");
    };

    if (Platform.OS === "web") {
      if (confirm(t.profile.logoutConfirm)) doLogout();
    } else {
      Alert.alert(t.profile.logout, t.profile.logoutConfirm, [
        { text: t.common.cancel, style: "cancel" },
        { text: t.profile.logout, style: "destructive", onPress: doLogout },
      ]);
    }
  };

  function showAlert(title: string, msg: string) {
    if (Platform.OS === "web") {
      alert(`${title}${msg ? ": " + msg : ""}`);
    } else {
      Alert.alert(title, msg || undefined);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settings.account}</Text>

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.auth.email}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.auth.fullName}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.full_name}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.auth.phone}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.phone_number || "-"}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.settings.country}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{currentCountry?.name || user?.country_code || "-"}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.badge, user?.email_verified ? styles.badgeSuccess : styles.badgeWarning]}>
              <Text style={[styles.badgeText, user?.email_verified ? { color: colors.success } : { color: colors.warning }]}>
                {user?.email_verified ? "OK" : "!"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settings.changePassword}</Text>

        {changingPassword ? (
          <View style={[styles.passwordCard, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.auth.password}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.auth.password}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.auth.confirmPassword}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder={t.auth.confirmPassword}
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }, passwordLoading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.common.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]} onPress={() => setChangingPassword(true)}>
            <View style={[styles.menuIcon, { backgroundColor: "rgba(239,68,68,0.12)" }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.error} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t.settings.changePassword}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settings.preferences}</Text>

        <View style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]}>
          <View style={[styles.menuIcon, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
            <Ionicons name="notifications-outline" size={20} color="#6366F1" />
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>{t.settings.notifications}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]}>
          <View style={[styles.menuIcon, { backgroundColor: "rgba(34,197,94,0.12)" }]}>
            <Ionicons name="language-outline" size={20} color={colors.success} />
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>{t.settings.language}</Text>
          <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{languageLabel}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>{t.profile.logout}</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textMuted }]}>
        {(configData as any)?.app_name || "DKD Market"} v{(configData as any)?.version || "1.0.0"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    maxWidth: "60%" as any,
    textAlign: "right" as const,
  },
  divider: {
    height: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  badgeWarning: {
    backgroundColor: "rgba(245,158,11,0.15)",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  menuValue: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  passwordCard: {
    borderRadius: 16,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  passwordActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 24,
  },
});
