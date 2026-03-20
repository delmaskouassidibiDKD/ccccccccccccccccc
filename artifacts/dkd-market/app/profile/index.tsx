import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      setAvatarUri(uri || user?.avatar_url || null);
    }).catch(() => {
      setAvatarUri(user?.avatar_url || null);
    });
  }, [user?.avatar_url]));

  const webTopInset = Platform.OS === "web" ? 0 : 0;

  function getRoleLabel(role: string | undefined): string {
    if (!role) return t.profile.client;
    const roles: string[] = [];
    const r = role.toLowerCase();
    if (r.includes("customer") || r.includes("client") || r === "user") {
      roles.push(t.profile.client);
    }
    if (r.includes("seller") || r.includes("vendor") || r.includes("company")) {
      roles.push(t.profile.seller);
    }
    if (r.includes("admin")) {
      roles.push(t.profile.admin);
    }
    if (r.includes("driver")) {
      roles.push(t.profile.driver);
    }
    return roles.length > 0 ? roles.join(", ") : t.profile.client;
  }

  function getRoleBadgeColor(role: string | undefined): string {
    const r = (role || "").toLowerCase();
    if (r.includes("admin")) return "#8B5CF6";
    if (r.includes("seller") || r.includes("vendor") || r.includes("company")) return colors.primary;
    return "#22C55E";
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const msg = t.common.error;
        Platform.OS === "web" ? alert(msg) : Alert.alert(t.common.error, msg);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        await AsyncStorage.setItem("@dkd:seller_profile_photo", uri);
      }
    } catch (e) {
      console.error("Image picker error:", e);
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const doLogout = async () => {
    setShowLogoutModal(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/auth/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      setShowLogoutModal(true);
    } else {
      Alert.alert(t.profile.logout, t.profile.logoutConfirm, [
        { text: t.common.cancel, style: "cancel" },
        { text: t.profile.logout, style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const handleRegister = () => {
    router.replace("/auth/register");
  };

  const roleLabel = getRoleLabel(user?.role);
  const roleBadgeColor = getRoleBadgeColor(user?.role);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.backgroundCard }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.profile.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.avatarImage, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.avatarPlusBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="add" size={18} color="#FFF" />
            </View>
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isAuthenticated && user ? (
          <>
            <View style={styles.userInfoSection}>
              <Text style={[styles.userName, { color: colors.text }]}>{user.full_name}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor + "20" }]}>
                <View style={[styles.roleDot, { backgroundColor: roleBadgeColor }]} />
                <Text style={[styles.roleText, { color: roleBadgeColor }]}>{roleLabel}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sellerCard]}
              onPress={() => router.push("/become-seller" as any)}
              activeOpacity={0.85}
            >
              <View style={styles.sellerCardLeft}>
                <View style={styles.sellerCardIcon}>
                  <Ionicons name="storefront" size={22} color="#FF6B00" />
                </View>
                <View>
                  <Text style={styles.sellerCardTitle}>DEVENIR VENDEUR 🧡</Text>
                  <Text style={styles.sellerCardSub}>Ouvrez votre boutique dans 15 pays</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,107,0,0.6)" />
            </TouchableOpacity>

            <View style={styles.menuSection}>
              <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]} onPress={() => router.push("/profile/settings")} activeOpacity={0.7}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(255,107,0,0.12)" }]}>
                  <Ionicons name="settings-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]}>{t.profile.accountSettings}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]} onPress={() => router.push("/profile/addresses")} activeOpacity={0.7}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
                  <Ionicons name="location-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]}>{t.profile.myAddresses}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]} activeOpacity={0.7}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
                  <Ionicons name="receipt-outline" size={20} color="#8B5CF6" />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]}>{t.profile.myOrders}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]} activeOpacity={0.7}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(236,72,153,0.12)" }]}>
                  <MaterialCommunityIcons name="heart-outline" size={20} color="#EC4899" />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]}>{t.profile.wishlist}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.userInfoSection}>
            <Text style={[styles.guestTitle, { color: colors.text }]}>{t.profile.guest}</Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>{t.profile.guestSubtitle}</Text>
          </View>
        )}

        <View style={styles.bottomSection}>
          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.7}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={22} color={colors.error} />
                  <Text style={[styles.logoutText, { color: colors.error }]}>{t.profile.logout}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={22} color="#FFF" />
              <Text style={styles.registerText}>{t.profile.registerBtn}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Ionicons name="log-out-outline" size={36} color={colors.error} style={{ marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.profile.logout}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{t.profile.logoutConfirm}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={doLogout}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalConfirmText, { color: colors.error }]}>{t.profile.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    position: "relative",
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
  },
  avatarPlusBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfoSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  userName: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  guestTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 20, marginBottom: 16, marginTop: 4,
    backgroundColor: "rgba(255,107,0,0.08)",
    borderWidth: 1.5, borderColor: "rgba(255,107,0,0.3)",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  sellerCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  sellerCardIcon: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: "rgba(255,107,0,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  sellerCardTitle: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#FF6B00" },
  sellerCardSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,107,0,0.6)", marginTop: 1 },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  menuIconBox: {
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
  bottomSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    padding: 16,
  },
  registerText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalCard: {
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
