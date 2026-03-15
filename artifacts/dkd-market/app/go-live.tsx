import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";

const { width: W, height: H } = Dimensions.get("window");
const BG   = "#0D1117";
const CARD = "#161B25";
const RED  = "#E53935";

const COUNTRIES = [
  { code: "all",  flag: "🌍", label: "Monde entier" },
  { code: "CG",   flag: "🇨🇬", label: "Congo" },
  { code: "CD",   flag: "🇨🇩", label: "RD Congo" },
  { code: "CM",   flag: "🇨🇲", label: "Cameroun" },
  { code: "CI",   flag: "🇨🇮", label: "Côte d'Ivoire" },
  { code: "SN",   flag: "🇸🇳", label: "Sénégal" },
  { code: "FR",   flag: "🇫🇷", label: "France" },
  { code: "BE",   flag: "🇧🇪", label: "Belgique" },
  { code: "MA",   flag: "🇲🇦", label: "Maroc" },
  { code: "GA",   flag: "🇬🇦", label: "Gabon" },
];

type Screen = "setup" | "live";

export default function GoLivePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [screen, setScreen]           = useState<Screen>("setup");
  const [description, setDescription] = useState("");
  const [countryMode, setCountryMode] = useState<"all" | "select">("all");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [linkProducts, setLinkProducts] = useState(false);

  // Live controls
  const [facing, setFacing]     = useState<"front" | "back">("front");
  const [paused, setPaused]     = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [viewers]               = useState(0);
  const [duration, setDuration] = useState(0);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim               = useRef(new Animated.Value(1)).current;

  const startLivePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleStartLive = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScreen("live");
    startLivePulse();
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const handleEndLive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  /* ─── LIVE SCREEN ─── */
  if (screen === "live") {
    return (
      <View style={styles.liveRoot}>
        {/* Camera */}
        {permission?.granted ? (
          <CameraView
            key={facing}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mute={micMuted}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noCamBg]}>
            <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.noCamText}>Caméra non disponible</Text>
          </View>
        )}

        {/* Dark overlay top + bottom */}
        <View style={styles.liveTopGrad} pointerEvents="none" />
        <View style={styles.liveBotGrad} pointerEvents="none" />

        {/* Top bar */}
        <View style={[styles.liveTopBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.liveBadgeRow}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveBadgeText}>EN DIRECT</Text>
          </View>
          <View style={styles.liveTimerBadge}>
            <Text style={styles.liveTimerText}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.liveViewers}>
            <Ionicons name="eye-outline" size={14} color="#fff" />
            <Text style={styles.liveViewersText}>{viewers}</Text>
          </View>
        </View>

        {/* Paused overlay */}
        {paused && (
          <View style={styles.pausedOverlay}>
            <Ionicons name="pause-circle-outline" size={80} color="rgba(255,255,255,0.8)" />
            <Text style={styles.pausedText}>Live en pause</Text>
          </View>
        )}

        {/* Bottom controls */}
        <View style={[styles.liveControls, { paddingBottom: insets.bottom + 20 }]}>
          {/* Mic */}
          <TouchableOpacity
            style={[styles.liveCtrlBtn, micMuted && styles.liveCtrlBtnActive]}
            onPress={() => { Haptics.selectionAsync(); setMicMuted((v) => !v); }}
          >
            <Ionicons name={micMuted ? "mic-off-outline" : "mic-outline"} size={18} color="#fff" />
            <Text style={styles.liveCtrlLabel}>{micMuted ? "Micro off" : "Micro"}</Text>
          </TouchableOpacity>

          {/* Pause */}
          <TouchableOpacity
            style={[styles.liveCtrlBtn, paused && styles.liveCtrlBtnActive]}
            onPress={() => { Haptics.selectionAsync(); setPaused((v) => !v); }}
          >
            <Ionicons name={paused ? "play-outline" : "pause-outline"} size={18} color="#fff" />
            <Text style={styles.liveCtrlLabel}>{paused ? "Reprendre" : "Pause"}</Text>
          </TouchableOpacity>

          {/* End */}
          <TouchableOpacity style={styles.liveEndBtn} onPress={handleEndLive}>
            <Ionicons name="stop-circle-outline" size={18} color="#fff" />
            <Text style={styles.liveEndText}>Terminer</Text>
          </TouchableOpacity>

          {/* Flip camera */}
          <TouchableOpacity
            style={styles.liveCtrlBtn}
            onPress={() => { Haptics.selectionAsync(); setFacing((f) => f === "front" ? "back" : "front"); }}
          >
            <Ionicons name="camera-reverse-outline" size={18} color="#fff" />
            <Text style={styles.liveCtrlLabel}>{facing === "front" ? "Arrière" : "Avant"}</Text>
          </TouchableOpacity>

          {/* Chat placeholder */}
          <TouchableOpacity style={styles.liveCtrlBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
            <Text style={styles.liveCtrlLabel}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ─── SETUP SCREEN ─── */
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Animated.View style={[styles.liveDotSmall, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.headerTitle}>Configurer le Live</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.setupScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview banner */}
        <View style={styles.previewBanner}>
          <View style={styles.previewIcon}>
            <Ionicons name="videocam" size={36} color={RED} />
          </View>
          <Text style={styles.previewTitle}>Prêt à diffuser ?</Text>
          <Text style={styles.previewSub}>Configurez votre session live avant de commencer.</Text>
        </View>

        {/* Description */}
        <Text style={styles.fieldLabel}>DESCRIPTION DU LIVE</Text>
        <View style={styles.fieldCard}>
          <TextInput
            style={styles.textarea}
            placeholder="Décrivez votre live... (promotions, produits présentés, etc.)"
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Link products */}
        <Text style={styles.fieldLabel}>ASSOCIER DES PRODUITS</Text>
        <View style={styles.rowCard}>
          <View style={styles.rowCardLeft}>
            <View style={[styles.rowCardIcon, { backgroundColor: "#3B82F622" }]}>
              <Ionicons name="cube-outline" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.rowCardTitle}>Produits mis en avant</Text>
              <Text style={styles.rowCardSub}>Affichez des produits pendant le live</Text>
            </View>
          </View>
          <Switch
            value={linkProducts}
            onValueChange={setLinkProducts}
            trackColor={{ false: "#1E293B", true: RED + "80" }}
            thumbColor={linkProducts ? RED : "#64748B"}
          />
        </View>
        {linkProducts && (
          <TouchableOpacity style={styles.addProductBtn} activeOpacity={0.75}>
            <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
            <Text style={styles.addProductText}>Sélectionner des produits</Text>
          </TouchableOpacity>
        )}

        {/* Country visibility */}
        <Text style={styles.fieldLabel}>VISIBILITÉ</Text>
        <View style={styles.visibilityRow}>
          <TouchableOpacity
            style={[styles.visibilityBtn, countryMode === "all" && styles.visibilityBtnActive]}
            onPress={() => setCountryMode("all")}
            activeOpacity={0.75}
          >
            <Text style={styles.visibilityBtnFlag}>🌍</Text>
            <Text style={[styles.visibilityBtnText, countryMode === "all" && { color: RED }]}>Monde entier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visibilityBtn, countryMode === "select" && styles.visibilityBtnActive]}
            onPress={() => setCountryMode("select")}
            activeOpacity={0.75}
          >
            <Ionicons name="flag-outline" size={16} color={countryMode === "select" ? RED : "#64748B"} />
            <Text style={[styles.visibilityBtnText, countryMode === "select" && { color: RED }]}>Pays spécifiques</Text>
          </TouchableOpacity>
        </View>

        {countryMode === "select" && (
          <View style={styles.countriesGrid}>
            {COUNTRIES.filter((c) => c.code !== "all").map((c) => {
              const sel = selectedCountries.includes(c.code);
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.countryChip, sel && styles.countryChipActive]}
                  onPress={() => { Haptics.selectionAsync(); toggleCountry(c.code); }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.countryFlag}>{c.flag}</Text>
                  <Text style={[styles.countryLabel, sel && { color: RED }]}>{c.label}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={14} color={RED} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info cards */}
        <Text style={styles.fieldLabel}>CONSEILS</Text>
        <View style={styles.tipsCard}>
          {[
            { icon: "wifi-outline",        color: "#34D399", tip: "Connexion stable recommandée (Wi-Fi ou 4G)" },
            { icon: "sunny-outline",       color: "#F59E0B", tip: "Bonne luminosité pour une meilleure qualité" },
            { icon: "volume-high-outline", color: "#60A5FA", tip: "Parlez clairement et à voix forte" },
          ].map((t) => (
            <View key={t.tip} style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: t.color + "22" }]}>
                <Ionicons name={t.icon as any} size={16} color={t.color} />
              </View>
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))}
        </View>

        {/* Start button */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStartLive} activeOpacity={0.85}>
          <View style={styles.startBtnDot} />
          <Ionicons name="videocam" size={22} color="#fff" />
          <Text style={styles.startBtnText}>Commencer le Live</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#F0F6FF",
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },

  /* Setup scroll */
  setupScroll: { padding: 16, gap: 14 },

  previewBanner: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RED + "33",
    gap: 8,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: RED + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#F0F6FF",
  },
  previewSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  fieldLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#475569",
    letterSpacing: 1.2,
    marginBottom: -4,
  },

  fieldCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
  },
  textarea: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#E2E8F0",
    minHeight: 80,
    textAlignVertical: "top",
  },

  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    gap: 12,
  },
  rowCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#E2E8F0",
  },
  rowCardSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#64748B",
  },
  addProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3B82F618",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#3B82F633",
  },
  addProductText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#3B82F6",
  },

  visibilityRow: {
    flexDirection: "row",
    gap: 10,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: CARD,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.07)",
  },
  visibilityBtnActive: {
    borderColor: RED + "66",
    backgroundColor: RED + "12",
  },
  visibilityBtnFlag: { fontSize: 16 },
  visibilityBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#64748B",
  },

  countriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: CARD,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  countryChipActive: {
    borderColor: RED + "55",
    backgroundColor: RED + "12",
  },
  countryFlag: { fontSize: 16 },
  countryLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#94A3B8",
  },

  tipsCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    gap: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#94A3B8",
    flex: 1,
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: RED,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  startBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },

  /* Live screen */
  liveRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  noCamBg: {
    backgroundColor: "#0D1117",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  noCamText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
  },
  liveTopGrad: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  liveBotGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  liveTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: RED,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  liveBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#fff",
    letterSpacing: 0.5,
  },
  liveTimerBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveTimerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  liveViewers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveViewersText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },

  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    gap: 12,
  },
  pausedText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
  },

  liveControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  liveCtrlBtn: {
    alignItems: "center",
    gap: 3,
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    minWidth: 44,
  },
  liveCtrlBtnActive: {
    backgroundColor: "rgba(229,57,53,0.4)",
  },
  liveCtrlLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    color: "#fff",
  },
  liveEndBtn: {
    alignItems: "center",
    gap: 3,
    padding: 6,
    borderRadius: 12,
    backgroundColor: RED,
    minWidth: 44,
  },
  liveEndText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
  },
});
