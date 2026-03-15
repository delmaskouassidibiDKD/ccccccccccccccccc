import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  AppState,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LINK_SECONDS = 60;
const CHECK_INTERVAL_MS = 4000;
const AUTO_DELETE_SECONDS = 300;
const STORAGE_KEY_GLOBAL = "dkd_verify_start_time";
const STORAGE_KEY_LINK = "dkd_verify_link_sent_time";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const { resendVerification, checkVerification, cancelRegistration, user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const email = paramEmail || user?.email || "";

  const [countdown, setCountdown] = useState(LINK_SECONDS);
  const [globalCountdown, setGlobalCountdown] = useState(AUTO_DELETE_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [verified, setVerified] = useState(false);
  const [expired, setExpired] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const globalStartRef = useRef<number>(0);
  const linkSentRef = useRef<number>(0);

  const cleanupTimers = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (checkRef.current) { clearInterval(checkRef.current); checkRef.current = null; }
  }, []);

  const doExpire = useCallback(async () => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    cleanupTimers();
    try { await cancelRegistration(); } catch {}
    await AsyncStorage.multiRemove([STORAGE_KEY_GLOBAL, STORAGE_KEY_LINK]);
    setExpired(true);
  }, [cancelRegistration, cleanupTimers]);

  const doCancel = useCallback(async () => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    setCancelling(true);
    cleanupTimers();
    try { await cancelRegistration(); } catch {}
    await AsyncStorage.multiRemove([STORAGE_KEY_GLOBAL, STORAGE_KEY_LINK]);
    router.replace("/auth/register");
  }, [cancelRegistration, cleanupTimers, router]);

  const computeTimers = useCallback(() => {
    const now = Date.now();
    const globalElapsed = Math.floor((now - globalStartRef.current) / 1000);
    const globalRemaining = AUTO_DELETE_SECONDS - globalElapsed;

    const linkElapsed = Math.floor((now - linkSentRef.current) / 1000);
    const linkRemaining = LINK_SECONDS - linkElapsed;

    return { globalRemaining, linkRemaining };
  }, []);

  const tick = useCallback(() => {
    const { globalRemaining, linkRemaining } = computeTimers();

    if (globalRemaining <= 0) {
      doExpire();
      return;
    }
    setGlobalCountdown(globalRemaining);

    if (linkRemaining <= 0) {
      setCountdown(0);
      setCanResend(true);
      if (!statusMessage) {
        setStatusMessage(t.verifyEmail.expired);
      }
    } else {
      setCountdown(linkRemaining);
      setCanResend(false);
    }
  }, [computeTimers, doExpire, statusMessage, t.verifyEmail.expired]);

  const startTicking = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tick();
    tickRef.current = setInterval(tick, 1000);
  }, [tick]);

  const startCheckInterval = useCallback(() => {
    if (checkRef.current) clearInterval(checkRef.current);
    checkRef.current = setInterval(async () => {
      try {
        const isVerified = await checkVerification();
        if (isVerified) {
          setVerified(true);
          cleanupTimers();
          await AsyncStorage.multiRemove([STORAGE_KEY_GLOBAL, STORAGE_KEY_LINK]);
          setTimeout(() => { router.replace("/(tabs)"); }, 1500);
        }
      } catch {}
    }, CHECK_INTERVAL_MS);
  }, [checkVerification, cleanupTimers, router]);

  const initTimers = useCallback(async () => {
    let storedGlobal = await AsyncStorage.getItem(STORAGE_KEY_GLOBAL);
    if (!storedGlobal) {
      const now = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY_GLOBAL, String(now));
      storedGlobal = String(now);
    }
    globalStartRef.current = parseInt(storedGlobal, 10);

    let storedLink = await AsyncStorage.getItem(STORAGE_KEY_LINK);
    if (!storedLink) {
      const now = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY_LINK, String(now));
      storedLink = String(now);
    }
    linkSentRef.current = parseInt(storedLink, 10);

    return computeTimers();
  }, [computeTimers]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { globalRemaining, linkRemaining } = await initTimers();
      if (!mounted) return;

      if (globalRemaining <= 0) {
        doExpire();
        return;
      }

      setGlobalCountdown(globalRemaining);

      if (linkRemaining <= 0) {
        setCountdown(0);
        setCanResend(true);
        setStatusMessage(t.verifyEmail.expired);
      } else {
        setCountdown(linkRemaining);
      }

      const isVerified = await checkVerification().catch(() => false);
      if (isVerified) {
        setVerified(true);
        await AsyncStorage.multiRemove([STORAGE_KEY_GLOBAL, STORAGE_KEY_LINK]);
        setTimeout(() => { router.replace("/(tabs)"); }, 1500);
        return;
      }

      startTicking();
      startCheckInterval();
    })();

    return () => {
      mounted = false;
      cleanupTimers();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && !verified && !expired && !cancelledRef.current) {
        const { globalRemaining, linkRemaining } = await initTimers();

        if (globalRemaining <= 0) {
          doExpire();
          return;
        }
        setGlobalCountdown(globalRemaining);

        if (linkRemaining <= 0) {
          setCountdown(0);
          setCanResend(true);
          setStatusMessage(t.verifyEmail.expired);
        } else {
          setCountdown(linkRemaining);
          setCanResend(false);
          setStatusMessage("");
        }

        const isVerified = await checkVerification().catch(() => false);
        if (isVerified) {
          setVerified(true);
          cleanupTimers();
          await AsyncStorage.multiRemove([STORAGE_KEY_GLOBAL, STORAGE_KEY_LINK]);
          setTimeout(() => { router.replace("/(tabs)"); }, 1500);
          return;
        }

        startTicking();
        startCheckInterval();
      }
    });
    return () => sub.remove();
  }, [verified, expired]);

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setStatusMessage("");
    try {
      await resendVerification();
      const now = Date.now();
      linkSentRef.current = now;
      await AsyncStorage.setItem(STORAGE_KEY_LINK, String(now));
      setCountdown(LINK_SECONDS);
      setCanResend(false);
      startTicking();
      startCheckInterval();
    } catch (e: any) {
      const msg = e?.message || t.common.error;
      setCanResend(true);
      if (Platform.OS === "web") {
        setStatusMessage(msg);
      } else {
        Alert.alert(t.common.error, msg);
      }
    } finally {
      setResending(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS === "web") {
      doCancel();
    } else {
      Alert.alert(
        t.common.cancel,
        t.common.confirm,
        [
          { text: t.common.no, style: "cancel" },
          { text: t.common.yes, style: "destructive", onPress: doCancel },
        ]
      );
    }
  };

  const handleReregister = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY_GLOBAL, STORAGE_KEY_LINK]);
    router.replace("/auth/register");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const webTopInset = Platform.OS === "web" ? 0 : 0;
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a: string, b: string, c: string) => a + "*".repeat(Math.min(b.length, 6)) + c)
    : "";

  if (verified) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset + 40 }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={[styles.successTitle]}>
            {t.verifyEmail.title}
          </Text>
          <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>{t.verifyEmail.verifying}</Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (expired) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset + 40 }]}>
        <View style={styles.centerContainer}>
          <View style={styles.expiredIconCircle}>
            <Ionicons name="time-outline" size={60} color="#FF4444" />
          </View>
          <Text style={styles.expiredTitle}>{t.verifyEmail.expired}</Text>
          <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>
            {t.verifyEmail.expiredDesc}
          </Text>
          <TouchableOpacity
            style={[styles.reregisterBtn, { backgroundColor: colors.primary }]}
            onPress={handleReregister}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={20} color="#FFF" />
            <Text style={styles.reregisterBtnText}>{t.verifyEmail.reRegister}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset + 20 }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t.verifyEmail.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t.verifyEmail.subtitle}
        </Text>
        <Text style={[styles.emailText, { color: colors.primary }]}>{maskedEmail}</Text>
        <Text style={[styles.instruction, { color: colors.textMuted }]}>
          {t.verifyEmail.checkInbox}
        </Text>

        <View style={styles.timerContainer}>
          {!canResend ? (
            <>
              <View style={[styles.timerCircle, { borderColor: colors.primary }]}>
                <Text style={[styles.timerText, { color: colors.primary }]}>{formatTime(countdown)}</Text>
              </View>
              <Text style={[styles.timerLabel, { color: colors.textMuted }]}>{t.verifyEmail.waitResend} {countdown}{t.verifyEmail.seconds}</Text>
            </>
          ) : (
            <View style={styles.expiredLinkContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#FF4444" />
              <Text style={styles.expiredLinkText}>{statusMessage || t.verifyEmail.expired}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.resendButton,
            { backgroundColor: colors.primary },
            !canResend && [styles.resendButtonDisabled, { backgroundColor: colors.surface }],
          ]}
          onPress={handleResend}
          disabled={!canResend || resending}
          activeOpacity={0.7}
        >
          {resending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={canResend ? "#FFF" : colors.textMuted}
              />
              <Text
                style={[
                  styles.resendButtonText,
                  !canResend && [styles.resendButtonTextDisabled, { color: colors.textMuted }],
                ]}
              >
                {t.verifyEmail.resend}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.globalTimerRow}>
          <Ionicons name="time-outline" size={16} color={globalCountdown <= 60 ? "#FF4444" : colors.textMuted} />
          <Text style={[styles.globalTimerText, { color: globalCountdown <= 60 ? "#FF4444" : colors.textMuted }]}>
            {t.verifyEmail.globalTimer} {formatTime(globalCountdown)}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.7}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#FF4444" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#FF4444" />
              <Text style={styles.cancelText}>{t.common.cancel}</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.cancelWarning, { color: colors.textMuted }]}>
          {t.verifyEmail.expiredDesc}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 107, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  expiredIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  emailText: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  instruction: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  timerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  timerText: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  timerLabel: {
    fontSize: 13,
  },
  expiredLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  expiredLinkText: {
    fontSize: 14,
    color: "#FF4444",
    fontWeight: "500" as const,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    maxWidth: 320,
  },
  resendButtonDisabled: {
    opacity: 1,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFF",
  },
  resendButtonTextDisabled: {
    color: "#999",
  },
  globalTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  globalTimerText: {
    fontSize: 13,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 15,
    color: "#FF4444",
    fontWeight: "500" as const,
  },
  cancelWarning: {
    fontSize: 12,
    marginTop: 4,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#4CAF50",
    marginTop: 16,
    marginBottom: 8,
  },
  centerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  expiredTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#FF4444",
    marginBottom: 12,
  },
  reregisterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginTop: 32,
    width: "100%",
    maxWidth: 320,
  },
  reregisterBtnText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFF",
  },
});
