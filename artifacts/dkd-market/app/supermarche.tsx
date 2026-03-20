import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, Modal, FlatList, Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ACCENT = "#F97316";
const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
}

type SaleMode = "normal_with_wholesale" | "normal_only" | "wholesale_only";
type PublishMethod = { key: string; icon: string; color: string; label: string; sub: string; tags: string[]; badge?: string; route: string };
const PUBLISH_METHODS: PublishMethod[] = [
  {
    key: "quick",
    icon: "flash-outline",
    color: "#F59E0B",
    label: "Publication rapide",
    sub: "Publiez en quelques secondes : nom, prix et photo. C'est tout !",
    tags: ["Ultra-rapide", "3 champs", "Minimal"],
    badge: "NOUVEAU",
    route: "/quick-publish?context=supermarche",
  },
  {
    key: "normal_with_wholesale",
    icon: "layers-outline",
    color: "#3B82F6",
    label: "Vente au détail + Vente en gros",
    sub: "Vendez à l'unité ET en grande quantité aux revendeurs",
    tags: ["Multi-mode", "Détail", "Gros"],
    route: "/add-product?saleMode=normal_with_wholesale",
  },
  {
    key: "normal_only",
    icon: "cart-outline",
    color: "#F97316",
    label: "Vente au détail — Prix unique",
    sub: "Un prix public fixe pour tous, sans option gros",
    tags: ["Grand public", "Prix fixe"],
    route: "/add-product?saleMode=normal_only",
  },
  {
    key: "wholesale_only",
    icon: "cube-outline",
    color: "#34D399",
    label: "Vente en gros uniquement",
    sub: "Exclusivement aux professionnels, par paliers de quantité",
    tags: ["Professionnels", "B2B", "Min. commande"],
    route: "/add-product?saleMode=wholesale_only",
  },
];

export default function SuperMarchePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [isOpen,       setIsOpen]       = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPublish,  setShowPublish]  = useState(false);
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

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Mon Super Marché";
  const initial     = displayName.charAt(0).toUpperCase();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet([
      "@dkd:supermarche_open",
      "@dkd:supermarche_opentime",
      "@dkd:supermarche_closetime",
      "@dkd:seller_profile_photo",
    ]).then(([o, ot, ct, photo]) => {
      if (o[1] !== null)     setIsOpen(o[1] === "1");
      if (ot[1] !== null)    setOpenTime(ot[1]);
      if (ct[1] !== null)    setCloseTime(ct[1]);
      if (photo[1] !== null) setProfilePhoto(photo[1]);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      if (uri) setProfilePhoto(uri);
    }).catch(() => {});
  }, []));

  const toggleOpen = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(val);
    AsyncStorage.setItem("@dkd:supermarche_open", val ? "1" : "0");
  };

  const saveSchedule = () => {
    AsyncStorage.multiSet([
      ["@dkd:supermarche_opentime",  openTime],
      ["@dkd:supermarche_closetime", closeTime],
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSchedule(false);
  };

  const currentPick = pickingFor === "open" ? openTime : closeTime;
  const setPick = (t: string) => {
    Haptics.selectionAsync();
    if (pickingFor === "open") setOpenTime(t); else setCloseTime(t);
  };

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
            <Ionicons name="storefront-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>Super Marché</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* SELLER CARD */}
        <View style={[s.sellerCard, { backgroundColor: dynCARD, borderColor: ACCENT + "33" }]}>
          <View style={s.sellerGlow} />
          <View style={[s.sellerAvatar, { backgroundColor: ACCENT + "33", borderColor: ACCENT + "88" }]}>
            {profilePhoto
              ? <Image source={{ uri: profilePhoto }} style={{ width: "100%", height: "100%", borderRadius: 999 }} />
              : <Text style={[s.sellerAvatarText, { color: ACCENT }]}>{initial}</Text>
            }
          </View>
          <View style={s.sellerInfo}>
            <Text style={[s.sellerName, { color: dynText }]}>{displayName}</Text>
            <View style={[s.sellerBadge, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="storefront-outline" size={11} color={ACCENT} />
              <Text style={[s.sellerBadgeText, { color: ACCENT }]}>Super Marché</Text>
            </View>
          </View>

          {/* Status row */}
          <View style={[s.statusRow, { borderTopColor: dynBorder }]}>
            <View style={s.statusLeft}>
              <View style={[s.statusDot, { backgroundColor: isOpen ? "#22C55E" : "#EF4444" }]} />
              <Text style={[s.statusLabel, { color: dynText }]}>
                {isOpen ? "Super Marché ouvert" : "Super Marché fermé"}
              </Text>
            </View>
            <View style={s.statusRight}>
              {/* Schedule button */}
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
                trackColor={{ false: isDark ? "#334155" : "#CBD5E1", true: "#22C55E66" }}
                thumbColor={isOpen ? "#22C55E" : isDark ? "#475569" : "#94A3B8"}
              />
            </View>
          </View>

          {/* Schedule preview */}
          <View style={[s.schedulePreview, { borderTopColor: dynBorder, backgroundColor: isDark ? "#0D1117" : "#F8FAFC" }]}>
            <View style={s.schedulePreviewItem}>
              <Ionicons name="sunny-outline" size={13} color="#F59E0B" />
              <Text style={[s.schedulePreviewText, { color: dynSub }]}>Ouverture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{openTime}</Text></Text>
            </View>
            <View style={[s.schedulePreviewDivider, { backgroundColor: dynBorder }]} />
            <View style={s.schedulePreviewItem}>
              <Ionicons name="moon-outline" size={13} color="#818CF8" />
              <Text style={[s.schedulePreviewText, { color: dynSub }]}>Fermeture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{closeTime}</Text></Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>GESTION</Text>
        <View style={s.actionsCol}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: ACCENT, borderColor: ACCENT }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowPublish(true); }}
            activeOpacity={0.85}
          >
            <View style={[s.actionIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: "#fff" }]}>Publier un produit</Text>
              <Text style={[s.actionSub, { color: "rgba(255,255,255,0.7)" }]}>Choisir le mode de vente</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: ACCENT + "44" }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/mon-marche-supermarche" as any); }}
            activeOpacity={0.85}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="eye-outline" size={24} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Voir mon Super Marché</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Aperçu de votre vitrine</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: ACCENT + "44" }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/mes-produits-supermarche" as any); }}
            activeOpacity={0.85}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="list-outline" size={24} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Gérer mes produits</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Voir, modifier vos articles</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/messages-grossiste" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: "#3B82F622" }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#3B82F6" />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Messages</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Vos conversations clients</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/collaborateur-supermarche" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="people-outline" size={24} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Collaborateurs</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Gérer votre équipe</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PUBLISH MODAL */}
      <Modal visible={showPublish} transparent animationType="slide" onRequestClose={() => setShowPublish(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: dynSheet }]}>
            <View style={[s.modalHeader, { borderBottomColor: dynBorder }]}>
              <View>
                <Text style={[s.modalTitle, { color: dynText }]}>Publier un produit</Text>
                <Text style={[{ color: dynSub, fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 }]}>Choisissez votre mode de vente</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPublish(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={dynSub} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }} showsVerticalScrollIndicator={false}>
              {PUBLISH_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[s.publishCard, { backgroundColor: dynCARD, borderColor: m.color }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowPublish(false);
                    router.push(m.route as any);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[s.publishStrip, { backgroundColor: m.color }]} />
                  <View style={s.publishInner}>
                    <View style={s.publishTop}>
                      <View style={[s.publishIcon, { backgroundColor: m.color + "22" }]}>
                        <Ionicons name={m.icon as any} size={22} color={m.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 2 }}>
                          <Text style={[s.publishLabel, { color: m.color }]}>{m.label}</Text>
                          {m.badge && (
                            <View style={[s.publishBadge, { backgroundColor: m.color + "22", borderColor: m.color + "55" }]}>
                              <Text style={[s.publishBadgeText, { color: m.color }]}>{m.badge}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[s.publishSub, { color: dynSub }]}>{m.sub}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={m.color + "88"} />
                    </View>
                    <View style={s.publishTags}>
                      {m.tags.map((tag) => (
                        <View key={tag} style={[s.publishTag, { backgroundColor: m.color + "14", borderColor: m.color + "33" }]}>
                          <Text style={[s.publishTagText, { color: m.color }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SCHEDULE MODAL */}
      <Modal visible={showSchedule} transparent animationType="slide" onRequestClose={() => setShowSchedule(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: dynSheet }]}>
            <View style={[s.modalHeader, { borderBottomColor: dynBorder }]}>
              <Text style={[s.modalTitle, { color: dynText }]}>Planifier l'ouverture</Text>
              <TouchableOpacity onPress={() => setShowSchedule(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={dynSub} />
              </TouchableOpacity>
            </View>

            {/* Tab: open or close */}
            <View style={[s.pickTabs, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}>
              <TouchableOpacity
                style={[s.pickTab, pickingFor === "open" && { backgroundColor: ACCENT, borderRadius: 10 }]}
                onPress={() => setPickingFor("open")} activeOpacity={0.8}
              >
                <Ionicons name="sunny-outline" size={14} color={pickingFor === "open" ? "#fff" : dynSub} />
                <Text style={[s.pickTabText, { color: pickingFor === "open" ? "#fff" : dynSub }]}>Ouverture</Text>
                <Text style={[s.pickTabTime, { color: pickingFor === "open" ? "#fff" : ACCENT }]}>{openTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.pickTab, pickingFor === "close" && { backgroundColor: "#818CF8", borderRadius: 10 }]}
                onPress={() => setPickingFor("close")} activeOpacity={0.8}
              >
                <Ionicons name="moon-outline" size={14} color={pickingFor === "close" ? "#fff" : dynSub} />
                <Text style={[s.pickTabText, { color: pickingFor === "close" ? "#fff" : dynSub }]}>Fermeture</Text>
                <Text style={[s.pickTabTime, { color: pickingFor === "close" ? "#fff" : "#818CF8" }]}>{closeTime}</Text>
              </TouchableOpacity>
            </View>

            {/* Time grid */}
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

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  sellerCard:       { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  sellerGlow:       { position: "absolute", top: -40, left: "20%", width: 160, height: 160, borderRadius: 80, backgroundColor: "#F9731618" },
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
  actionsCol:   { gap: 10 },
  actionBtn:    { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, gap: 14, borderWidth: 1 },
  actionIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionText:   { flex: 1, gap: 2 },
  actionTitle:  { fontFamily: "Poppins_700Bold", fontSize: 15 },
  actionSub:    { fontFamily: "Poppins_400Regular", fontSize: 12 },

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

  publishBadge:     { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  publishBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 9 },
  publishCard:  { flexDirection: "row", borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  publishStrip: { width: 5 },
  publishInner: { flex: 1, padding: 13, gap: 9 },
  publishTop:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  publishIcon:  { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  publishLabel: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  publishSub:   { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16, marginTop: 2 },
  publishTags:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  publishTag:   { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  publishTagText: { fontFamily: "Poppins_500Medium", fontSize: 10 },
});
