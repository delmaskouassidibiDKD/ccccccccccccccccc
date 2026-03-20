import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, Modal, FlatList, Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import ProfilePhotoAvatar from "@/components/ProfilePhotoAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ACCENT = "#EC4899";

const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
}

export default function MonPlatPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [isOpen,       setIsOpen]       = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [openTime,     setOpenTime]     = useState("08:00");
  const [closeTime,    setCloseTime]    = useState("21:00");
  const [pickingFor,   setPickingFor]   = useState<"open" | "close">("open");

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynSheet  = isDark ? "#1E293B" : "#FFFFFF";

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Gastronomie";
  const initial     = displayName.charAt(0).toUpperCase();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet([
      "@dkd:monplat_open",
      "@dkd:monplat_opentime",
      "@dkd:monplat_closetime",
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
    AsyncStorage.setItem("@dkd:monplat_open", val ? "1" : "0");
  };

  const saveSchedule = () => {
    AsyncStorage.multiSet([
      ["@dkd:monplat_opentime",  openTime],
      ["@dkd:monplat_closetime", closeTime],
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
            <Ionicons name="restaurant-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>Gastronomie</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* SELLER CARD — même design que Mon Marché */}
        <View style={[s.sellerCard, { backgroundColor: dynCARD, borderColor: ACCENT + "33" }]}>
          <View style={[s.sellerGlow, { backgroundColor: ACCENT + "18" }]} />

          {/* Avatar centré en haut */}
          <ProfilePhotoAvatar
            photoUri={profilePhoto}
            initials={initial}
            onPhotoChanged={setProfilePhoto}
            size={68}
            fontSize={28}
            borderColor={ACCENT + "88"}
            bgColor={ACCENT + "33"}
            initialsColor={ACCENT}
            style={{ alignSelf: "center", marginTop: 24 }}
          />

          {/* Nom + badge Gastronomia */}
          <View style={s.sellerInfo}>
            <Text style={[s.sellerName, { color: dynText }]}>{displayName}</Text>
            <View style={[s.sellerBadge, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="restaurant-outline" size={11} color={ACCENT} />
              <Text style={[s.sellerBadgeText, { color: ACCENT }]}>Gastronomie</Text>
            </View>
          </View>

          {/* Status row — ouvert/fermé + Planifier + Switch */}
          <View style={[s.statusRow, { borderTopColor: dynBorder }]}>
            <View style={s.statusLeft}>
              <View style={[s.statusDot, { backgroundColor: isOpen ? "#22C55E" : "#EF4444" }]} />
              <Text style={[s.statusLabel, { color: dynText }]}>
                {isOpen ? "Gastronomie ouvert" : "Gastronomie fermé"}
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
              <Text style={[s.schedulePreviewText, { color: dynSub }]}>Ouverture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{openTime}</Text></Text>
            </View>
            <View style={[s.schedulePreviewDivider, { backgroundColor: dynBorder }]} />
            <View style={s.schedulePreviewItem}>
              <Ionicons name="moon-outline" size={13} color="#818CF8" />
              <Text style={[s.schedulePreviewText, { color: dynSub }]}>Fermeture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{closeTime}</Text></Text>
            </View>
          </View>
        </View>

        {/* SECTION GESTION */}
        <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>GESTION</Text>
        <View style={s.actionsCol}>

          {/* Ajouter un délice */}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/publication-gastronomia" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="add-circle-outline" size={26} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Ajouter un délice</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Publiez un nouveau plat ou produit</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          {/* Gérer mes délices */}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/gerer-delices" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="fast-food-outline" size={26} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Gérer mes délices</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Voir et modifier mes plats publiés</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          {/* Voir ma boutique */}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/voir-boutique-gastronomia" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="storefront-outline" size={26} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Voir ma boutique</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Aperçu de votre vitrine culinaire</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          {/* Messages */}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/messages-grossiste" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: "#3B82F622" }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color="#3B82F6" />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Messages</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Vos conversations clients</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

          {/* Collaborateurs */}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: dynCARD, borderColor: dynBorder }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/collaborateur-gastronomie" as any); }}
            activeOpacity={0.8}
          >
            <View style={[s.actionIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="people-outline" size={26} color={ACCENT} />
            </View>
            <View style={s.actionText}>
              <Text style={[s.actionTitle, { color: dynText }]}>Collaborateurs</Text>
              <Text style={[s.actionSub, { color: dynSub }]}>Gérer votre équipe culinaire</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynSub} />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* SCHEDULE MODAL */}
      <Modal visible={showSchedule} animationType="slide" transparent onRequestClose={() => setShowSchedule(false)}>
        <View style={[s.modalOverlay]}>
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

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

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
});
