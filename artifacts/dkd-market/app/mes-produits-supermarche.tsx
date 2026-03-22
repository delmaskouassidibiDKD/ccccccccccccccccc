import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Pressable, Switch, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import * as Haptics from "expo-haptics";

const ACCENT = "#F97316";
type Tab = "rayons" | "engros";

const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
  }
}

const INIT_RAYONS: SellerProduct[] = [
  { id: "1", shopName: "Super Abidjan",   shopFlag: "🇨🇮", title: "Riz parfumé Thaï 25kg",    price: "14 500 FCFA", rating: 4.8, reviewCount: 312, status: "active",   icon: "leaf-outline",  color: "#3B7A43" },
  { id: "2", shopName: "FreshMart Dakar", shopFlag: "🇸🇳", title: "Huile végétale 5L Palmy",  price: "3 800 FCFA",  rating: 4.5, reviewCount: 189, status: "active",   icon: "water-outline", color: "#F59E0B" },
  { id: "3", shopName: "BioShop Lomé",    shopFlag: "🇹🇬", title: "Lait en poudre Nido 900g", price: "6 200 FCFA",  rating: 4.6, reviewCount: 244, status: "active",   icon: "cafe-outline",  color: "#0EA5E9" },
];
const INIT_ENGROS: SellerProduct[] = [
  { id: "1", shopName: "Grossiste ABJ",      shopFlag: "🇨🇮", title: "Palette riz Thaï 50 sacs",     price: "680 000 FCFA", rating: 4.7, reviewCount: 28, status: "active",   icon: "cube-outline",    color: "#1B4D9E", minQty: "50 sacs"   },
  { id: "2", shopName: "DistribPro Cotonou", shopFlag: "🇧🇯", title: "Carton huile 24 bidons 5L",    price: "84 000 FCFA",  rating: 4.3, reviewCount: 15, status: "active",   icon: "layers-outline",  color: "#7B4226", minQty: "24 bidons" },
  { id: "3", shopName: "MegaStock Conakry",  shopFlag: "🇬🇳", title: "Lot lait en poudre 12 boîtes", price: "72 000 FCFA",  rating: 4.1, reviewCount: 9,  status: "inactive", icon: "archive-outline", color: "#4B5563", minQty: "12 boîtes" },
];

export default function MesProduitsSuperMarchePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab]       = useState<Tab>("rayons");
  const [searchQuery, setSearchQuery]   = useState("");
  const [rayons, setRayons]             = useState(INIT_RAYONS);
  const [engros, setEngros]             = useState(INIT_ENGROS);
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null);
  const [isActive,     setIsActive]     = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [openTime,     setOpenTime]     = useState("08:00");
  const [closeTime,    setCloseTime]    = useState("21:00");
  const [pickingFor,   setPickingFor]   = useState<"open" | "close">("open");

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynCard   = isDark ? "#1C2230" : "#FFFFFF";
  const dynText   = isDark ? "#FFFFFF" : "#111827";
  const dynSheet  = isDark ? "#1E293B" : "#FFFFFF";

  const TABS = [
    { key: "rayons" as Tab, label: "Rayons",  count: rayons.length, icon: "cube-outline"   },
    { key: "engros" as Tab, label: "En gros", count: engros.length, icon: "layers-outline" },
  ];
  const rawData  = activeTab === "rayons" ? rayons : engros;
  const isEngros = activeTab === "engros";
  const q        = searchQuery.toLowerCase().trim();
  const data     = q ? rawData.filter(i => i.title.toLowerCase().includes(q)) : rawData;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (activeTab === "rayons") setRayons(prev => prev.filter(i => i.id !== deleteTarget.id));
    else setEngros(prev => prev.filter(i => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };
  const saveSchedule = () => setShowSchedule(false);
  const currentPick  = pickingFor === "open" ? openTime : closeTime;
  const pickTime = (t: string) => { if (pickingFor === "open") setOpenTime(t); else setCloseTime(t); };

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="storefront-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: isDark ? "#fff" : "#111" }]}>Gérer mes produits</Text>
        </View>
      </View>

      <View style={[s.statusBlock, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <View style={s.statusRow}>
          <View style={s.statusLeft}>
            <View style={[s.statusDot, { backgroundColor: isActive ? "#22C55E" : "#EF4444" }]} />
            <Text style={[s.statusLabel, { color: dynText }]}>{isActive ? "Super Marché actif" : "Super Marché inactif"}</Text>
          </View>
          <View style={s.statusRight}>
            <TouchableOpacity style={[s.scheduleBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "44" }]} onPress={() => { Haptics.selectionAsync(); setShowSchedule(true); }} activeOpacity={0.75}>
              <Ionicons name="time-outline" size={15} color={ACCENT} />
              <Text style={[s.scheduleBtnText, { color: ACCENT }]}>Planifier</Text>
            </TouchableOpacity>
            <Switch value={isActive} onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsActive(v); }} trackColor={{ false: isDark ? "#334155" : "#CBD5E1", true: "#22C55E66" }} thumbColor={isActive ? "#22C55E" : isDark ? "#475569" : "#94A3B8"} />
          </View>
        </View>
        <View style={[s.schedulePreview, { backgroundColor: isDark ? "#0D1117" : "#F8FAFC" }]}>
          <View style={s.schedulePreviewItem}><Ionicons name="sunny-outline" size={13} color="#F59E0B" /><Text style={[s.schedulePreviewText, { color: dynSub }]}>Ouverture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{openTime}</Text></Text></View>
          <View style={[s.schedulePreviewDivider, { backgroundColor: dynBorder }]} />
          <View style={s.schedulePreviewItem}><Ionicons name="moon-outline" size={13} color="#818CF8" /><Text style={[s.schedulePreviewText, { color: dynSub }]}>Fermeture : <Text style={{ color: dynText, fontFamily: "Poppins_600SemiBold" }}>{closeTime}</Text></Text></View>
        </View>
      </View>

      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dynBorder }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[s.tab, { backgroundColor: isDark ? "#1A1A1A" : "#EFEFEF" }, active && [s.tabActive, { borderColor: ACCENT + "66", backgroundColor: ACCENT + "14" }]]} onPress={() => { setActiveTab(tab.key); setSearchQuery(""); Haptics.selectionAsync(); }} activeOpacity={0.8}>
              <Ionicons name={tab.icon as any} size={15} color={active ? ACCENT : dynSub} />
              <Text style={[s.tabLabel, { color: active ? ACCENT : dynSub }]}>{tab.label}</Text>
              <View style={[s.tabBadge, { backgroundColor: active ? ACCENT + "28" : (isDark ? "#2D2D2D" : "#E5E7EB") }]}>
                <Text style={[s.tabBadgeText, { color: active ? ACCENT : dynSub }]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[s.searchWrap, { backgroundColor: dynBG, borderBottomColor: dynBorder }]}>
        <View style={[s.searchBox, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderColor: dynBorder }]}>
          <Ionicons name="search-outline" size={15} color={dynSub} />
          <TextInput style={[s.searchInput, { color: dynText }]} placeholder={isEngros ? "Rechercher en gros…" : "Rechercher dans les rayons…"} placeholderTextColor={dynSub} value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}><Ionicons name="close-circle" size={16} color={dynSub} /></TouchableOpacity>}
        </View>
      </View>

      <FlatList
        key={activeTab}
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SellerProductCard item={item} isDark={isDark} isEngros={isEngros} accentColor={ACCENT} onEdit={() => {}} onVideo={() => {}} onDelete={() => { Haptics.selectionAsync(); setDeleteTarget(item); }} />
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="cube-outline" size={48} color={dynSub} /><Text style={[s.emptyTitle, { color: dynSub }]}>{q ? "Aucun résultat" : "Aucun produit"}</Text></View>}
      />

      <Modal visible={deleteTarget !== null} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={s.overlay} onPress={() => setDeleteTarget(null)}>
          <Pressable style={[s.modalCard, { backgroundColor: dynCard }]} onPress={() => {}}>
            <View style={s.trashCircle}><Ionicons name="trash-outline" size={28} color="#EF4444" /></View>
            <Text style={[s.modalTitle, { color: dynText }]}>Supprimer l'article ?</Text>
            <Text style={[s.modalDesc, { color: dynSub }]}>« {deleteTarget?.title} » sera définitivement supprimé de vos publications.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.cancelBtn, { backgroundColor: isDark ? "#2D3748" : "#F1F5F9" }]} onPress={() => setDeleteTarget(null)} activeOpacity={0.8}><Text style={[s.cancelText, { color: dynText }]}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={confirmDelete} activeOpacity={0.8}><Text style={s.deleteText}>Supprimer</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showSchedule} transparent animationType="slide" onRequestClose={() => setShowSchedule(false)}>
        <Pressable style={s.sheetOverlay} onPress={() => setShowSchedule(false)}>
          <Pressable style={[s.modalSheet, { backgroundColor: dynSheet }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: dynText }]}>Planifier l'activité</Text>
              <TouchableOpacity onPress={() => setShowSchedule(false)} activeOpacity={0.7}><Ionicons name="close" size={22} color={dynSub} /></TouchableOpacity>
            </View>
            <View style={[s.pickTabs, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}>
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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  statusBlock: { borderBottomWidth: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  scheduleBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  scheduleBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  schedulePreview: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 12 },
  schedulePreviewItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  schedulePreviewDivider: { width: 1, height: 20 },
  schedulePreviewText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { borderWidth: 1.5 },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  tabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  searchWrap: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, padding: 0 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  trashCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, textAlign: "center" },
  modalDesc: { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  deleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#EF4444" },
  deleteText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  pickTabs: { flexDirection: "row", margin: 14, borderRadius: 12, padding: 4, gap: 4, borderWidth: 1 },
  pickTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9 },
  pickTabText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  pickTabTime: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
  timeText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 14, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
