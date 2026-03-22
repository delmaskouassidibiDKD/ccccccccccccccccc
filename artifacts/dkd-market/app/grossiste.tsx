import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  FlatList,
  Modal,
  Pressable,
  Dimensions,
  TextInput,
  Switch,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import ProfilePhotoAvatar from "@/components/ProfilePhotoAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");
const DRAWER_W = Math.min(SCREEN_W * 0.72, 280);
const ACCENT   = "#3B82F6";
const ACCENT2  = "#1D4ED8";

type Section = "accueil";
const PAYMENT_OPTIONS = ["Mobile Money", "Virement", "Espèces", "Carte"];
const MENU_ITEMS: { id: Section; icon: string; label: string; color: string }[] = [
  { id: "accueil", icon: "home-outline", label: "Accueil", color: ACCENT },
];

export default function GrossistePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { browse } = useLocalSearchParams<{ browse?: string }>();

  const [activeSection, setActiveSection] = useState<Section>("accueil");
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [phone,         setPhone]         = useState("");
  const [whatsapp,      setWhatsapp]      = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    AsyncStorage.multiGet(["@dkd:gros_phone", "@dkd:gros_whatsapp", "@dkd:gros_payment", "@dkd:seller_profile_photo"]).then((pairs) => {
      if (pairs[0][1]) setPhone(pairs[0][1]);
      if (pairs[1][1]) setWhatsapp(pairs[1][1]);
      if (pairs[2][1]) setPaymentMethod(pairs[2][1]);
      if (pairs[3][1]) setProfilePhoto(pairs[3][1]);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      if (uri) setProfilePhoto(uri);
    }).catch(() => {});
  }, []));

  const saveField = (key: string, val: string) => AsyncStorage.setItem(key, val);

  const drawerX        = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerX,        { toValue: 0,        useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(overlayOpacity, { toValue: 1,        duration: 220,         useNativeDriver: true }),
    ]).start();
  }, []);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.spring(drawerX,        { toValue: -DRAWER_W, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(overlayOpacity, { toValue: 0,          duration: 180,        useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  }, []);

  const navigateTo = (section: Section) => {
    Haptics.selectionAsync();
    setActiveSection(section);
    closeDrawer();
  };

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Boss";
  const initial     = displayName.charAt(0).toUpperCase();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynDrawer = isDark ? "#111827" : "#F8FAFC";
  const dynBar    = isDark ? "#fff" : "#1A1A1A";

  const currentMenu = MENU_ITEMS.find((m) => m.id === activeSection);

  if (browse === "1") {
    return <GrossisteBrowsePage router={router} insets={insets} isDark={isDark} dynBG={dynBG} dynText={dynText} dynSub={dynSub} dynHeader={dynHeader} dynBorder={dynBorder} />;
  }

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
          <View style={s.hamburger}>
            <View style={[s.bar, s.barTop, { backgroundColor: dynBar }]} />
            <View style={[s.bar, s.barMid, { backgroundColor: dynBar }]} />
            <View style={[s.bar, s.barBot, { backgroundColor: dynBar }]} />
          </View>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIconWrap, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="cube-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>{currentMenu?.label ?? "Grossiste"}</Text>
        </View>
        <TouchableOpacity style={[s.closeBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={dynSub} />
        </TouchableOpacity>
      </View>

      {/* ── CONTENT ── */}
      <View style={{ flex: 1 }}>
        {activeSection === "accueil" && (
          <AccueilView
            displayName={displayName}
            initial={initial}
            profilePhoto={profilePhoto}
            onPhotoChanged={setProfilePhoto}
            isDark={isDark}
            dynBG={dynBG}
            dynCARD={dynCARD}
            dynText={dynText}
            dynSub={dynSub}
            dynBorder={dynBorder}
          />
        )}
      </View>

      {/* ── OVERLAY ── */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[s.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      {/* ── DRAWER ── */}
      <Animated.View
        style={[s.drawer, { width: DRAWER_W, backgroundColor: dynDrawer, borderRightColor: ACCENT + "22", transform: [{ translateX: drawerX }] }]}
        pointerEvents={drawerOpen ? "auto" : "none"}
      >
        {/* Drawer header */}
        <View style={[s.drawerHeader, { paddingTop: insets.top + 12, borderBottomColor: dynBorder, backgroundColor: ACCENT2 + (isDark ? "18" : "10") }]}>
          <ProfilePhotoAvatar
            photoUri={profilePhoto}
            initials={initial}
            onPhotoChanged={setProfilePhoto}
            size={56}
            fontSize={22}
            borderColor={ACCENT + "88"}
            bgColor={ACCENT + "33"}
            initialsColor={ACCENT}
          />
          <Text style={[s.drawerName, { color: dynText }]}>{displayName}</Text>
          <View style={s.drawerBadge}>
            <Ionicons name="cube-outline" size={10} color="#fff" />
            <Text style={s.drawerBadgeText}>Grossiste</Text>
          </View>
        </View>

        <ScrollView style={s.drawerScroll} showsVerticalScrollIndicator={false}>

          {/* Nav items */}
          {MENU_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.drawerItem, isActive && { backgroundColor: ACCENT + "15" }]}
                onPress={() => navigateTo(item.id)}
                activeOpacity={0.75}
              >
                <View style={[s.drawerItemIcon, { backgroundColor: item.color + "22" }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={[s.drawerItemLabel, { color: isActive ? dynText : dynSub }]}>{item.label}</Text>
                {isActive && <View style={[s.drawerActiveBar, { backgroundColor: item.color }]} />}
              </TouchableOpacity>
            );
          })}

          {/* Collaborateur */}
          <TouchableOpacity
            style={s.drawerItem}
            onPress={() => { closeDrawer(); setTimeout(() => router.push("/collaborateur-grossiste" as any), 300); }}
            activeOpacity={0.75}
          >
            <View style={[s.drawerItemIcon, { backgroundColor: "#34D39922" }]}>
              <Ionicons name="person-add-outline" size={18} color="#34D399" />
            </View>
            <Text style={[s.drawerItemLabel, { color: dynSub }]}>Ajouter un collaborateur</Text>
          </TouchableOpacity>

          <View style={[s.drawerDivider, { backgroundColor: dynBorder }]} />

          {/* Theme toggle */}
          <View style={[s.drawerThemeRow, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
            <View style={[s.drawerItemIcon, { backgroundColor: isDark ? "#FBBF2422" : "#60A5FA22" }]}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={18} color={isDark ? "#FBBF24" : "#60A5FA"} />
            </View>
            <Text style={[s.drawerThemeLabel, { color: dynSub }]}>{isDark ? "Thème sombre" : "Thème clair"}</Text>
            <Switch
              value={!isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#334155", true: "#60A5FA66" }}
              thumbColor={!isDark ? "#60A5FA" : "#475569"}
            />
          </View>

          <View style={[s.drawerDivider, { backgroundColor: dynBorder }]} />

          <TouchableOpacity
            style={s.drawerItem}
            onPress={() => { closeDrawer(); setTimeout(() => router.back(), 300); }}
            activeOpacity={0.75}
          >
            <View style={[s.drawerItemIcon, { backgroundColor: "#EF444422" }]}>
              <Ionicons name="exit-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[s.drawerItemLabel, { color: "#EF4444" }]}>Quitter</Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
}

/* ─────── Accueil ─────── */
type AccueilProps = {
  displayName: string;
  initial: string;
  profilePhoto: string | null;
  onPhotoChanged: (uri: string) => void;
  isDark: boolean;
  dynBG: string;
  dynCARD: string;
  dynText: string;
  dynSub: string;
  dynBorder: string;
};

const PAYS_LIST = [
  { code: "bj", label: "Bénin",         flag: "🇧🇯" },
  { code: "bf", label: "Burkina Faso",   flag: "🇧🇫" },
  { code: "ci", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "gm", label: "Gambie",        flag: "🇬🇲" },
  { code: "gh", label: "Ghana",         flag: "🇬🇭" },
  { code: "gn", label: "Guinée",        flag: "🇬🇳" },
  { code: "gw", label: "Guinée-Bissau", flag: "🇬🇼" },
  { code: "lr", label: "Liberia",       flag: "🇱🇷" },
  { code: "ml", label: "Mali",          flag: "🇲🇱" },
  { code: "mr", label: "Mauritanie",    flag: "🇲🇷" },
  { code: "ne", label: "Niger",         flag: "🇳🇪" },
  { code: "ng", label: "Nigeria",       flag: "🇳🇬" },
  { code: "sn", label: "Sénégal",       flag: "🇸🇳" },
  { code: "sl", label: "Sierra Leone",  flag: "🇸🇱" },
  { code: "tg", label: "Togo",          flag: "🇹🇬" },
];

function AccueilView({ displayName, initial, profilePhoto, onPhotoChanged, isDark, dynCARD, dynText, dynSub, dynBorder }: AccueilProps) {
  const router = useRouter();
  const [paysExpanded, setPaysExpanded] = useState(false);
  const [selectedPays, setSelectedPays] = useState<Set<string>>(new Set());
  const [isActive,     setIsActive]     = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [openTime,     setOpenTime]     = useState("08:00");
  const [closeTime,    setCloseTime]    = useState("18:00");
  const [pickingFor,   setPickingFor]   = useState<"open" | "close">("open");
  const dynSheet  = isDark ? "#1E293B" : "#FFFFFF";
  const dynBorderLocal = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const currentPick  = pickingFor === "open" ? openTime : closeTime;
  const pickTime = (t: string) => { if (pickingFor === "open") setOpenTime(t); else setCloseTime(t); };
  const saveSchedule = () => setShowSchedule(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("@dkd:gros_pays").then((raw) => {
      if (raw) setSelectedPays(new Set(JSON.parse(raw)));
    });
  }, []);

  const togglePays = () => {
    Haptics.selectionAsync();
    const next = !paysExpanded;
    setPaysExpanded(next);
    Animated.spring(rotateAnim, { toValue: next ? 1 : 0, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
  };

  const toggleCountry = (code: string) => {
    Haptics.selectionAsync();
    setSelectedPays((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      AsyncStorage.setItem("@dkd:gros_pays", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const selectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allCodes = PAYS_LIST.map((p) => p.code);
    const allSet = new Set(allCodes);
    setSelectedPays(allSet);
    AsyncStorage.setItem("@dkd:gros_pays", JSON.stringify(allCodes));
  };

  const allSelected = selectedPays.size === PAYS_LIST.length;
  const chevronRotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.accueilScroll} showsVerticalScrollIndicator={false}>

      {/* Welcome banner */}
      <View style={[s.welcomeCard, { backgroundColor: dynCARD, borderColor: ACCENT + "33" }]}>
        <View style={s.welcomeGlow} />
        <ProfilePhotoAvatar
          photoUri={profilePhoto}
          initials={initial}
          onPhotoChanged={onPhotoChanged}
          size={64}
          fontSize={26}
          borderColor={ACCENT + "88"}
          bgColor={ACCENT + "33"}
          initialsColor={ACCENT}
        />
        <Text style={[s.welcomeTitle, { color: dynText }]}>
          Bienvenue,{"\n"}
          <Text style={s.welcomeName}>{displayName}</Text>
        </Text>
        <View style={s.welcomeBadge}>
          <Ionicons name="cube-outline" size={12} color={ACCENT} />
          <Text style={s.welcomeBadgeText}>Espace Grossiste</Text>
        </View>

        {/* ── Statut actif/inactif ── */}
        <View style={[s.statusRow, { borderTopColor: dynBorderLocal, marginTop: 10 }]}>
          <View style={s.statusLeft}>
            <View style={[s.statusDot, { backgroundColor: isActive ? "#22C55E" : "#EF4444" }]} />
            <Text style={[s.statusLabel, { color: dynText }]}>{isActive ? "Grossiste actif" : "Grossiste inactif"}</Text>
          </View>
          <View style={s.statusRight}>
            <TouchableOpacity style={[s.scheduleBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "44" }]} onPress={() => { Haptics.selectionAsync(); setShowSchedule(true); }} activeOpacity={0.75}>
              <Ionicons name="time-outline" size={15} color={ACCENT} />
              <Text style={[s.scheduleBtnText, { color: ACCENT }]}>Planifier</Text>
            </TouchableOpacity>
            <Switch value={isActive} onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsActive(v); }} trackColor={{ false: isDark ? "#334155" : "#CBD5E1", true: "#22C55E66" }} thumbColor={isActive ? "#22C55E" : isDark ? "#475569" : "#94A3B8"} />
          </View>
        </View>
        <View style={[s.schedulePreview, { borderTopColor: dynBorderLocal, backgroundColor: isDark ? "#0D1117" : "#F8FAFC" }]}>
          <View style={s.schedulePreviewItem}><Ionicons name="sunny-outline" size={13} color="#F59E0B" /><Text style={[s.schedulePreviewText, { color: dynSub }]}>Ouverture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{openTime}</Text></Text></View>
          <View style={[s.schedulePreviewDivider, { backgroundColor: dynBorderLocal }]} />
          <View style={s.schedulePreviewItem}><Ionicons name="moon-outline" size={13} color="#818CF8" /><Text style={[s.schedulePreviewText, { color: dynSub }]}>Fermeture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{closeTime}</Text></Text></View>
        </View>
      </View>

      {/* MODAL PLANIFIER */}
      <Modal visible={showSchedule} transparent animationType="slide" onRequestClose={() => setShowSchedule(false)}>
        <Pressable style={s.sheetOverlay} onPress={() => setShowSchedule(false)}>
          <Pressable style={[s.modalSheet, { backgroundColor: dynSheet }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: dynText }]}>Planifier l'activité</Text>
              <TouchableOpacity onPress={() => setShowSchedule(false)} activeOpacity={0.7}><Ionicons name="close" size={22} color={dynSub} /></TouchableOpacity>
            </View>
            <View style={[s.pickTabs, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorderLocal }]}>
              <TouchableOpacity style={[s.pickTab, pickingFor === "open" && { backgroundColor: ACCENT, borderRadius: 10 }]} onPress={() => setPickingFor("open")}>
                <Ionicons name="sunny-outline" size={14} color={pickingFor === "open" ? "#fff" : dynSub} />
                <Text style={[s.pickTabText, { color: pickingFor === "open" ? "#fff" : dynSub }]}>Ouverture</Text>
                <Text style={[s.pickTabTime, { color: pickingFor === "open" ? "#fff" : ACCENT }]}>{openTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.pickTab, pickingFor === "close" && { backgroundColor: "#818CF8", borderRadius: 10 }]} onPress={() => setPickingFor("close")}>
                <Ionicons name="moon-outline" size={14} color={pickingFor === "close" ? "#fff" : dynSub} />
                <Text style={[s.pickTabText, { color: pickingFor === "close" ? "#fff" : dynSub }]}>Fermeture</Text>
                <Text style={[s.pickTabTime, { color: pickingFor === "close" ? "#fff" : "#818CF8" }]}>{closeTime}</Text>
              </TouchableOpacity>
            </View>
            <FlatList data={TIMES} keyExtractor={(t) => t} style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14 }}
              renderItem={({ item: t }) => (
                <TouchableOpacity style={[s.timeRow, t === currentPick && { backgroundColor: ACCENT + "18", borderRadius: 10 }]} onPress={() => pickTime(t)} activeOpacity={0.7}>
                  <Text style={[s.timeText, { color: t === currentPick ? ACCENT : dynText }, t === currentPick && { fontFamily: "Poppins_700Bold" }]}>{t}</Text>
                  {t === currentPick && <Ionicons name="checkmark-circle" size={18} color={ACCENT} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: ACCENT }]} onPress={saveSchedule} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.saveBtnText}>Confirmer la planification</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* GESTION DES ARTICLES */}
      <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>GESTION DES ARTICLES</Text>
      <View style={s.actionsCol}>
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: ACCENT, borderColor: ACCENT }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/publication-grossiste" as any); }}
          activeOpacity={0.85}
        >
          <View style={[s.actionBtnIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="add-circle-outline" size={26} color="#fff" />
          </View>
          <View style={s.actionBtnTextWrap}>
            <Text style={[s.actionBtnTitle, { color: "#fff" }]}>Publier des produits</Text>
            <Text style={[s.actionBtnSub, { color: "rgba(255,255,255,0.7)" }]}>Ajouter un nouveau produit grossiste</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: ACCENT + "33" }]}
          onPress={() => { Haptics.selectionAsync(); router.push("/mes-produits-grossiste" as any); }}
          activeOpacity={0.85}
        >
          <View style={[s.actionBtnIconWrap, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="list-outline" size={26} color={ACCENT} />
          </View>
          <View style={s.actionBtnTextWrap}>
            <Text style={[s.actionBtnTitle, { color: dynText }]}>Gérer les articles</Text>
            <Text style={[s.actionBtnSub, { color: dynSub }]}>Voir, modifier ou supprimer vos produits</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={dynSub} />
        </TouchableOpacity>
      </View>

      {/* ACCÈS RAPIDE */}
      <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>ACCÈS RAPIDE</Text>
      <View style={s.quickGrid}>
        {[
          { icon: "chatbubble-ellipses-outline", color: ACCENT,    label: "Messages",              route: "/messages-grossiste" },
          { icon: "megaphone-outline",            color: "#EC4899", label: "Campagne publicitaire", route: null },
        ].map((q) => (
          <TouchableOpacity
            key={q.label}
            style={[s.quickCard, { backgroundColor: dynCARD, borderColor: q.color + "33" }]}
            onPress={() => { if (q.route) router.push(q.route as any); }}
            activeOpacity={0.75}
          >
            <View style={[s.quickCardIcon, { backgroundColor: q.color + "22" }]}>
              <Ionicons name={q.icon as any} size={22} color={q.color} />
            </View>
            <Text style={[s.quickCardLabel, { color: dynSub }]}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MON ESPACE */}
      <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>MON ESPACE</Text>
      <View style={s.actionsCol}>
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: "#34D39944" }]}
          onPress={() => { Haptics.selectionAsync(); router.push("/grossiste?browse=1" as any); }}
          activeOpacity={0.85}
        >
          <View style={[s.actionBtnIconWrap, { backgroundColor: "#34D39922" }]}>
            <Ionicons name="storefront-outline" size={24} color="#34D399" />
          </View>
          <View style={s.actionBtnTextWrap}>
            <Text style={[s.actionBtnTitle, { color: dynText }]}>Voir la boutique</Text>
            <Text style={[s.actionBtnSub, { color: dynSub }]}>Aperçu de votre vitrine grossiste</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={dynSub} />
        </TouchableOpacity>

      </View>

      {/* ── ZONES COMMERCIALES ── */}
      <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>ZONES COMMERCIALES</Text>
      <View style={[s.paysCard, { backgroundColor: dynCARD, borderColor: ACCENT + "22" }]}>

        {/* Toggle header */}
        <TouchableOpacity style={s.paysToggleRow} onPress={togglePays} activeOpacity={0.8}>
          <View style={[s.paysToggleIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="earth-outline" size={20} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.paysToggleTitle, { color: dynText }]}>Pays d'activité</Text>
            <Text style={[s.paysToggleSub, { color: dynSub }]}>
              {selectedPays.size === 0
                ? "Aucun pays sélectionné"
                : allSelected
                ? "Tous les pays (15)"
                : `${selectedPays.size} pays sélectionné${selectedPays.size > 1 ? "s" : ""}`}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={20} color={dynSub} />
          </Animated.View>
        </TouchableOpacity>

        {/* Expandable grid */}
        {paysExpanded && (
          <View style={[s.paysGridWrap, { borderTopColor: dynBorder }]}>
            {/* Tous les pays button */}
            <TouchableOpacity
              style={[s.paysTousBtn, { borderColor: allSelected ? ACCENT : dynBorder, backgroundColor: allSelected ? ACCENT + "15" : "transparent" }]}
              onPress={selectAll}
              activeOpacity={0.8}
            >
              <Ionicons name="globe-outline" size={16} color={allSelected ? ACCENT : dynSub} />
              <Text style={[s.paysTousBtnText, { color: allSelected ? ACCENT : dynSub }]}>Tous les pays</Text>
              {allSelected && <Ionicons name="checkmark-circle" size={16} color={ACCENT} />}
            </TouchableOpacity>

            {/* Country chips grid */}
            <View style={s.paysGrid}>
              {PAYS_LIST.map((pays) => {
                const active = selectedPays.has(pays.code);
                return (
                  <TouchableOpacity
                    key={pays.code}
                    style={[s.paysChip, { borderColor: active ? ACCENT : dynBorder, backgroundColor: active ? ACCENT + "15" : "transparent" }]}
                    onPress={() => toggleCountry(pays.code)}
                    activeOpacity={0.75}
                  >
                    <Text style={s.paysFlag}>{pays.flag}</Text>
                    <Text style={[s.paysLabel, { color: active ? ACCENT : dynText }]} numberOfLines={1}>{pays.label}</Text>
                    {active && <Ionicons name="checkmark-circle" size={13} color={ACCENT} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* ─────── Browse page ─────── */
type BrowseProps = { router: any; insets: any; isDark: boolean; dynBG: string; dynText: string; dynSub: string; dynHeader: string; dynBorder: string };
function GrossisteBrowsePage({ router, insets, isDark, dynBG, dynText, dynSub, dynHeader, dynBorder }: BrowseProps) {
  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.closeBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIconWrap, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="cube-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>Grossiste</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: ACCENT + "22", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="cube-outline" size={36} color={ACCENT} />
        </View>
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: dynText }}>Grossiste</Text>
        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: dynSub, textAlign: "center", paddingHorizontal: 40 }}>
          Cette section est en cours de développement.{"\n"}Bientôt disponible !
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuBtn: { padding: 6 },
  hamburger: { gap: 4.5, width: 22 },
  bar: { height: 2, borderRadius: 2 },
  barTop: { width: 22 },
  barMid: { width: 16 },
  barBot: { width: 22 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },

  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    borderRightWidth: 1,
  },
  drawerHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT + "33",
    borderWidth: 2,
    borderColor: ACCENT + "88",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  drawerAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 22, color: ACCENT },
  drawerName:      { fontFamily: "Poppins_700Bold", fontSize: 15, marginBottom: 6, textAlign: "center" },
  drawerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ACCENT + "33",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  drawerBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: ACCENT },
  drawerScroll:    { flex: 1, paddingTop: 8 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginHorizontal: 8,
    marginVertical: 1,
    borderRadius: 12,
    position: "relative",
  },
  drawerItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, flex: 1 },
  drawerActiveBar: {
    position: "absolute",
    left: 8,
    top: "25%",
    bottom: "25%",
    width: 3,
    borderRadius: 2,
  },
  drawerDivider: { height: 1, marginHorizontal: 16, marginVertical: 8 },
  drawerThemeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  drawerThemeLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, flex: 1 },
  drawerFieldGroup:      { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4, gap: 8 },
  drawerFieldGroupLabel: { fontSize: 10, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.8, marginBottom: 2 },
  drawerFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  drawerFieldIcon:  { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  drawerFieldInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  drawerPaymentChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  drawerPayChip:    { borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 5 },
  drawerPayChipText:{ fontFamily: "Poppins_500Medium", fontSize: 11 },

  accueilScroll: { padding: 16, gap: 16 },
  welcomeCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    gap: 10,
  },
  welcomeGlow: {
    position: "absolute",
    top: -40,
    left: "25%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: ACCENT + "20",
  },
  welcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT + "33",
    borderWidth: 2,
    borderColor: ACCENT + "88",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 26, color: ACCENT },
  welcomeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 30,
  },
  welcomeName:  { color: ACCENT, fontFamily: "Poppins_700Bold" },
  welcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: ACCENT + "22",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  welcomeBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: ACCENT },

  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 1.2 },

  statusRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  statusLeft:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  statusDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  statusLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, flexShrink: 1 },
  scheduleBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  scheduleBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  schedulePreview: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, gap: 12, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  schedulePreviewItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  schedulePreviewDivider: { width: 1, height: 20 },
  schedulePreviewText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  sheetTitle:   { fontFamily: "Poppins_700Bold", fontSize: 16 },
  pickTabs:     { flexDirection: "row", margin: 14, borderRadius: 12, padding: 4, gap: 4, borderWidth: 1 },
  pickTab:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9 },
  pickTabText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  pickTabTime:  { fontFamily: "Poppins_700Bold", fontSize: 13 },
  timeRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
  timeText:     { fontFamily: "Poppins_400Regular", fontSize: 14 },
  saveBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 14, borderRadius: 14, paddingVertical: 14 },
  saveBtnText:  { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },

  actionsCol: { gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  actionBtnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnTextWrap: { flex: 1, gap: 2 },
  actionBtnTitle:    { fontFamily: "Poppins_700Bold", fontSize: 15 },
  actionBtnSub:      { fontFamily: "Poppins_400Regular", fontSize: 12 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  quickCardIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickCardLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, textAlign: "center" },

  paysCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  paysToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  paysToggleIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  paysToggleTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  paysToggleSub:   { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 1 },
  paysGridWrap:  { borderTopWidth: 1, padding: 12, gap: 10 },
  paysTousBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paysTousBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, flex: 1 },
  paysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  paysChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  paysFlag:  { fontSize: 16 },
  paysLabel: { fontFamily: "Poppins_500Medium", fontSize: 12 },
});
