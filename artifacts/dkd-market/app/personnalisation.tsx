import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, Modal, FlatList, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ACCENT = "#06B6D4";
const SCREEN_W = Dimensions.get("window").width;

const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
}

type ActionItem = {
  key: string;
  icon: string;
  label: string;
  sub: string;
  color: string;
  route: string;
  featured?: boolean;
};

const ACTIONS: ActionItem[] = [
  {
    key: "publish",
    icon: "add-circle-outline",
    label: "Publier un produit",
    sub: "Publication rapide ou vente en gros",
    color: ACCENT,
    route: "/publication-personnalisation",
    featured: true,
  },
  {
    key: "voir-produits",
    icon: "cube-outline",
    label: "Voir mes produits",
    sub: "Aperçu de votre catalogue",
    color: ACCENT,
    route: "/voir-produits-personnalisation",
  },
  {
    key: "gerer-produits",
    icon: "settings-outline",
    label: "Gérer mes produits",
    sub: "Produits & vidéos",
    color: "#8B5CF6",
    route: "/gerer-produits-personnalisation",
  },
  {
    key: "message",
    icon: "chatbubble-ellipses-outline",
    label: "Messages",
    sub: "Vos conversations clients",
    color: "#3B82F6",
    route: "/messages-grossiste",
  },
  {
    key: "commandes",
    icon: "bag-handle-outline",
    label: "Mes commandes",
    sub: "Suivi et gestion",
    color: "#F59E0B",
    route: "/commandes-personnalisation",
  },
  {
    key: "services",
    icon: "grid-outline",
    label: "Mes services",
    sub: "Gérer vos offres",
    color: "#8B5CF6",
    route: "/services-personnalisation",
  },
  {
    key: "collaborateur",
    icon: "people-outline",
    label: "Collaborateurs",
    sub: "Gérer votre équipe",
    color: ACCENT,
    route: "/collaborateur-personnalisation",
  },
  {
    key: "paiements",
    icon: "wallet-outline",
    label: "Paiements",
    sub: "En attente & réglés",
    color: "#22C55E",
    route: "/paiements-personnalisation",
  },
  {
    key: "campagnes",
    icon: "megaphone-outline",
    label: "Campagnes pub",
    sub: "Boostez votre visibilité",
    color: "#EC4899",
    route: "/campagnes-personnalisation",
  },
];

export default function PersonnalisationPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [isOpen,       setIsOpen]       = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [openTime,     setOpenTime]     = useState("08:00");
  const [closeTime,    setCloseTime]    = useState("20:00");
  const [pickingFor,   setPickingFor]   = useState<"open" | "close">("open");

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynSheet  = isDark ? "#1E293B" : "#FFFFFF";

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Personnalisation";
  const initial     = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    AsyncStorage.multiGet([
      "@dkd:personnalisation_open",
      "@dkd:personnalisation_opentime",
      "@dkd:personnalisation_closetime",
    ]).then(([o, ot, ct]) => {
      if (o[1] !== null)  setIsOpen(o[1] === "1");
      if (ot[1] !== null) setOpenTime(ot[1]);
      if (ct[1] !== null) setCloseTime(ct[1]);
    });
  }, []);

  const toggleOpen = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(val);
    AsyncStorage.setItem("@dkd:personnalisation_open", val ? "1" : "0");
  };

  const saveSchedule = () => {
    AsyncStorage.multiSet([
      ["@dkd:personnalisation_opentime",  openTime],
      ["@dkd:personnalisation_closetime", closeTime],
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSchedule(false);
  };

  const currentPick = pickingFor === "open" ? openTime : closeTime;
  const setPick = (t: string) => {
    Haptics.selectionAsync();
    if (pickingFor === "open") setOpenTime(t); else setCloseTime(t);
  };

  const featuredActions = ACTIONS.filter((a) => a.featured);
  const gridActions     = ACTIONS.filter((a) => !a.featured);
  const GRID_CELL = (SCREEN_W - 32 - 10) / 2;

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => router.back()} activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-palette-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>Personnalisation</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* SELLER CARD */}
        <View style={[s.sellerCard, { backgroundColor: dynCARD, borderColor: ACCENT + "33" }]}>
          <View style={[s.sellerGlow, { backgroundColor: ACCENT + "18" }]} />

          {/* Avatar */}
          <View style={[s.sellerAvatar, { backgroundColor: ACCENT + "33", borderColor: ACCENT + "88" }]}>
            <Text style={[s.sellerAvatarText, { color: ACCENT }]}>{initial}</Text>
          </View>

          {/* Nom + badge */}
          <View style={s.sellerInfo}>
            <Text style={[s.sellerName, { color: dynText }]}>{displayName}</Text>
            <View style={[s.sellerBadge, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="color-palette-outline" size={11} color={ACCENT} />
              <Text style={[s.sellerBadgeText, { color: ACCENT }]}>Personnalisation</Text>
            </View>
          </View>

          {/* Status row */}
          <View style={[s.statusRow, { borderTopColor: dynBorder }]}>
            <View style={s.statusLeft}>
              <View style={[s.statusDot, { backgroundColor: isOpen ? "#22C55E" : "#EF4444" }]} />
              <Text style={[s.statusLabel, { color: dynText }]}>
                {isOpen ? "Boutique ouverte" : "Boutique fermée"}
              </Text>
            </View>
            <View style={s.statusRight}>
              <TouchableOpacity
                style={[s.scheduleBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "44" }]}
                onPress={() => { Haptics.selectionAsync(); setShowSchedule(true); }}
                activeOpacity={0.75}
              >
                <Ionicons name="time-outline" size={15} color={ACCENT} />
                <Text style={[s.scheduleBtnText, { color: ACCENT }]}>Planifier</Text>
              </TouchableOpacity>
              <Switch
                value={isOpen}
                onValueChange={toggleOpen}
                trackColor={{ false: isDark ? "#334155" : "#CBD5E1", true: ACCENT + "66" }}
                thumbColor={isOpen ? ACCENT : isDark ? "#475569" : "#94A3B8"}
              />
            </View>
          </View>

          {/* Schedule preview */}
          <View style={[s.schedulePreview, { borderTopColor: dynBorder, backgroundColor: isDark ? "#0D1117" : "#F8FAFC" }]}>
            <View style={s.schedulePreviewItem}>
              <Ionicons name="sunny-outline" size={13} color="#F59E0B" />
              <Text style={[s.schedulePreviewText, { color: dynSub }]}>
                Ouverture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{openTime}</Text>
              </Text>
            </View>
            <View style={[s.schedulePreviewDivider, { backgroundColor: dynBorder }]} />
            <View style={s.schedulePreviewItem}>
              <Ionicons name="moon-outline" size={13} color="#818CF8" />
              <Text style={[s.schedulePreviewText, { color: dynSub }]}>
                Fermeture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{closeTime}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION ACTIONS */}
        <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>MES OUTILS</Text>

        {/* Featured — Publier un article (full width) */}
        {featuredActions.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[s.featuredBtn, { backgroundColor: dynCARD, borderColor: a.color + "55" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(a.route as any); }}
            activeOpacity={0.85}
          >
            <View style={[s.featuredLeft, { backgroundColor: a.color + "18" }]}>
              <Ionicons name={a.icon as any} size={28} color={a.color} />
            </View>
            <View style={s.featuredText}>
              <Text style={[s.featuredTitle, { color: dynText }]}>{a.label}</Text>
              <Text style={[s.featuredSub, { color: dynSub }]}>{a.sub}</Text>
            </View>
            <View style={[s.featuredArrow, { backgroundColor: a.color + "18" }]}>
              <Ionicons name="flash-outline" size={16} color={a.color} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Grid — 2 cols for remaining actions */}
        <View style={s.grid}>
          {gridActions.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[s.gridCell, { width: GRID_CELL, backgroundColor: dynCARD, borderColor: dynBorder }]}
              onPress={() => { Haptics.selectionAsync(); router.push(a.route as any); }}
              activeOpacity={0.8}
            >
              <View style={[s.gridIcon, { backgroundColor: a.color + "18" }]}>
                <Ionicons name={a.icon as any} size={24} color={a.color} />
              </View>
              <Text style={[s.gridTitle, { color: dynText }]} numberOfLines={1}>{a.label}</Text>
              <Text style={[s.gridSub, { color: dynSub }]} numberOfLines={2}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* SCHEDULE MODAL */}
      <Modal visible={showSchedule} animationType="slide" transparent onRequestClose={() => setShowSchedule(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: dynSheet }]}>
            <View style={[s.modalHeader, { borderBottomColor: dynBorder }]}>
              <Text style={[s.modalTitle, { color: dynText }]}>Planifier les horaires</Text>
              <TouchableOpacity onPress={() => setShowSchedule(false)}>
                <Ionicons name="close-circle" size={24} color={dynSub} />
              </TouchableOpacity>
            </View>

            <View style={[s.pickTabs, { backgroundColor: isDark ? "#0D1117" : "#F1F5F9", borderColor: dynBorder }]}>
              {(["open", "close"] as const).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[s.pickTab, pickingFor === k && { backgroundColor: ACCENT, borderRadius: 10 }]}
                  onPress={() => setPickingFor(k)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={k === "open" ? "sunny-outline" : "moon-outline"} size={14} color={pickingFor === k ? "#fff" : dynSub} />
                  <Text style={[s.pickTabText, { color: pickingFor === k ? "#fff" : dynSub }]}>
                    {k === "open" ? "Ouverture" : "Fermeture"}
                  </Text>
                  <Text style={[s.pickTabTime, { color: pickingFor === k ? "#fff" : k === "open" ? "#F59E0B" : "#818CF8" }]}>
                    {k === "open" ? openTime : closeTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              data={TIMES}
              keyExtractor={(t) => t}
              numColumns={4}
              style={{ maxHeight: 260 }}
              contentContainerStyle={s.timeGrid}
              renderItem={({ item }) => {
                const active = item === currentPick;
                return (
                  <TouchableOpacity
                    style={[s.timeChip, { borderColor: active ? ACCENT : dynBorder, backgroundColor: active ? ACCENT + "18" : "transparent" }]}
                    onPress={() => setPick(item)} activeOpacity={0.75}
                  >
                    <Text style={[s.timeChipText, { color: active ? ACCENT : dynText }]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={[s.saveBtn, { backgroundColor: ACCENT }]} onPress={saveSchedule} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Confirmer la planification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn:      { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 17, flex: 1 },

  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  sellerCard:       { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  sellerGlow:       { position: "absolute", top: -40, left: "20%", width: 160, height: 160, borderRadius: 80 },
  sellerAvatar:     { alignSelf: "center", marginTop: 24, width: 68, height: 68, borderRadius: 34, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  sellerAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  sellerInfo:       { alignItems: "center", paddingTop: 10, paddingBottom: 16, gap: 6 },
  sellerName:       { fontFamily: "Poppins_700Bold", fontSize: 17 },
  sellerBadge:      { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  sellerBadgeText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  statusRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  statusLeft:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot:   { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  scheduleBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  scheduleBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },

  schedulePreview:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, gap: 12 },
  schedulePreviewItem:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  schedulePreviewDivider: { width: 1, height: 20 },
  schedulePreviewText:    { fontFamily: "Poppins_400Regular", fontSize: 12 },

  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 1.2 },

  featuredBtn: {
    flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1.5,
    overflow: "hidden", padding: 0,
  },
  featuredLeft:  { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  featuredText:  { flex: 1, paddingVertical: 14, paddingLeft: 4 },
  featuredTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  featuredSub:   { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 2 },
  featuredArrow: { width: 40, height: "100%", alignItems: "center", justifyContent: "center" },

  grid:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  gridIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  gridTitle:{ fontFamily: "Poppins_700Bold", fontSize: 13 },
  gridSub:  { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  modalHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1 },
  modalTitle:   { fontFamily: "Poppins_700Bold", fontSize: 16 },

  pickTabs: { flexDirection: "row", margin: 14, borderRadius: 12, padding: 4, gap: 4, borderWidth: 1 },
  pickTab:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9 },
  pickTabText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  pickTabTime: { fontFamily: "Poppins_700Bold", fontSize: 13 },

  timeGrid:     { paddingHorizontal: 14, gap: 8 },
  timeChip:     { flex: 1, margin: 3, borderRadius: 10, borderWidth: 1, paddingVertical: 9, alignItems: "center" },
  timeChipText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 14, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
