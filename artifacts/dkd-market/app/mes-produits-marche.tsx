import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import * as Haptics from "expo-haptics";

const ACCENT = "#22C55E";

const INIT: SellerProduct[] = [
  { id: "1", shopName: "Marché Ouaga", shopFlag: "🇧🇫", title: "Tomates fraîches du jardin",   price: "500 FCFA",   rating: 4.8, reviewCount: 221, status: "active", icon: "leaf-outline",     color: "#C0392B" },
  { id: "2", shopName: "Bio Cotonou",  shopFlag: "🇧🇯", title: "Piment séché du terroir 500g", price: "1 200 FCFA", rating: 4.5, reviewCount: 88,  status: "active", icon: "flame-outline",    color: "#E67E22" },
  { id: "3", shopName: "Savons Lomé",  shopFlag: "🇹🇬", title: "Savon noir africain 250g",     price: "800 FCFA",   rating: 4.7, reviewCount: 142, status: "active", icon: "sparkles-outline", color: "#4A7C59" },
];

export default function MesProduitsMarche() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [items, setItems]             = useState(INIT);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null);

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynCard   = isDark ? "#1C2230" : "#FFFFFF";
  const dynText   = isDark ? "#FFFFFF" : "#111827";

  const q    = searchQuery.toLowerCase().trim();
  const data = q ? items.filter(i => i.title.toLowerCase().includes(q)) : items;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="basket-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: isDark ? "#fff" : "#111" }]}>Gérer mes produits</Text>
        </View>
      </View>

      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dynBorder }]}>
        <View style={[s.tabSingle, { borderColor: ACCENT + "55", backgroundColor: ACCENT + "12" }]}>
          <Ionicons name="basket-outline" size={15} color={ACCENT} />
          <Text style={[s.tabLabel, { color: ACCENT }]}>Détail</Text>
          <View style={[s.tabBadge, { backgroundColor: ACCENT + "25" }]}>
            <Text style={[s.tabBadgeText, { color: ACCENT }]}>{items.length}</Text>
          </View>
        </View>
      </View>

      <View style={[s.searchWrap, { backgroundColor: dynBG, borderBottomColor: dynBorder }]}>
        <View style={[s.searchBox, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderColor: dynBorder }]}>
          <Ionicons name="search-outline" size={15} color={dynSub} />
          <TextInput style={[s.searchInput, { color: dynText }]} placeholder="Rechercher un produit…" placeholderTextColor={dynSub} value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}><Ionicons name="close-circle" size={16} color={dynSub} /></TouchableOpacity>}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SellerProductCard item={item} isDark={isDark} isEngros={false} accentColor={ACCENT} onEdit={() => {}} onVideo={() => {}} onDelete={() => { Haptics.selectionAsync(); setDeleteTarget(item); }} />
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="basket-outline" size={48} color={dynSub} /><Text style={[s.emptyTitle, { color: dynSub }]}>{q ? "Aucun résultat" : "Aucun produit"}</Text></View>}
      />

      <Modal visible={deleteTarget !== null} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={s.overlay} onPress={() => setDeleteTarget(null)}>
          <Pressable style={[s.modalCard, { backgroundColor: dynCard }]} onPress={() => {}}>
            <View style={s.trashCircle}><Ionicons name="trash-outline" size={28} color="#EF4444" /></View>
            <Text style={[s.modalTitle, { color: dynText }]}>Supprimer l'article ?</Text>
            <Text style={[s.modalDesc, { color: dynSub }]}>« {deleteTarget?.title} » sera définitivement supprimé de vos publications.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.cancelBtn, { backgroundColor: isDark ? "#2D3748" : "#F1F5F9" }]} onPress={() => setDeleteTarget(null)} activeOpacity={0.8}>
                <Text style={[s.cancelText, { color: dynText }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={confirmDelete} activeOpacity={0.8}>
                <Text style={s.deleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
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
  tabBar: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  tabSingle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 10, borderWidth: 1.5 },
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
});
