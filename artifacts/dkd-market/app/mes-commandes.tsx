import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../contexts/ThemeContext";
import CommandeDetailModal, { SOURCE_CONFIG, type ProductSlide } from "@/components/CommandeDetailModal";
import type { Source } from "@/lib/orders-data";

const ACCENT = "#C0392B";

type OrderStatus = "pending" | "confirmed" | "annulee";

type Order = {
  id: string;
  clientName: string;
  initials: string;
  color: string;
  price: string;
  status: OrderStatus;
  time: string;
  source?: Source | null;
  products: ProductSlide[];
};

const INIT_ORDERS: Order[] = [
  {
    id: "o1", clientName: "Moussa Koné", initials: "MK", color: "#3B82F6",
    price: "12 500 FCFA", status: "pending", time: "09:14", source: "grossiste",
    products: [
      { id: "p1", name: "Sac Louis Vuitton", price: "6 250 FCFA", qty: 2, unit: "pièce", isGros: true,
        details: "12 taille M rouge\n10 taille L noir" },
    ],
  },
  {
    id: "o2", clientName: "Aminata Diallo", initials: "AD", color: "#EC4899",
    price: "8 200 FCFA", status: "pending", time: "10:02", source: "marche",
    products: [
      { id: "p1", name: "Chaussures Nike Air", price: "5 000 FCFA", qty: 1, unit: "paire", details: "Taille 42 · Blanc" },
      { id: "p2", name: "Sandales en cuir",    price: "3 200 FCFA", qty: 1, unit: "paire", details: "Taille 38 · Marron" },
    ],
  },
  {
    id: "o3", clientName: "Kofi Asante", initials: "KA", color: "#22C55E",
    price: "25 000 FCFA", status: "pending", time: "11:30", source: "personnalisation",
    products: [
      { id: "p1", name: "Veste en cuir", price: "8 333 FCFA", qty: 3, unit: "pièce",
        details: "Taille L × 2\nTaille XL × 1\nCouleur : Noir" },
    ],
  },
  {
    id: "o4", clientName: "Fatoumata Bah", initials: "FB", color: "#F59E0B",
    price: "34 000 FCFA", status: "confirmed", time: "08:45", source: "supermarche",
    products: [
      { id: "p1", name: "Riz parfumé 25kg",   price: "14 000 FCFA", qty: 2, unit: "sac",   isGros: true, details: "Marque premium" },
      { id: "p2", name: "Huile de tournesol",  price: "6 000 FCFA",  qty: 1, unit: "carton", details: "5L × 4 bouteilles" },
    ],
  },
  {
    id: "o5", clientName: "Ibrahim Diop", initials: "ID", color: "#8B5CF6",
    price: "18 750 FCFA", status: "confirmed", time: "07:30", source: null,
    products: [
      { id: "p1", name: "Écouteurs Bluetooth", price: "18 750 FCFA", qty: 1, unit: "pièce", details: "Coloris noir" },
    ],
  },
];

export default function MesCommandesPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dBG     = isDark ? "#0D1117" : "#F0F4F8";
  const dHEAD   = isDark ? "#111827" : "#1a1f2e";
  const dCARD   = isDark ? "#161B22" : "#FFFFFF";
  const dCARD2  = isDark ? "#1C2230" : "#F3F4F6";
  const dTEXT   = isDark ? "#FFFFFF" : "#111827";
  const dSUB    = isDark ? "rgba(255,255,255,0.6)"  : "#374151";
  const dMUTED  = isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF";
  const dBORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const [tab,    setTab]    = useState<"pending" | "confirmed">("pending");
  const [orders, setOrders] = useState<Order[]>(INIT_ORDERS);
  const [search, setSearch] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const visible = orders.filter((o) => o.status !== "annulee");
  const pendingCount   = visible.filter((o) => o.status === "pending").length;
  const confirmedCount = visible.filter((o) => o.status === "confirmed").length;

  const filtered = visible.filter((o) => {
    const matchTab = o.status === tab;
    const matchSearch = !search || o.clientName.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const confirmOrder = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "confirmed" as const } : o));
  }, []);

  const cancelOrder = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "annulee" as const } : o));
  }, []);

  const openDetail = useCallback((order: Order) => {
    Haptics.selectionAsync();
    setDetailOrder(order);
    setDetailOpen(true);
  }, []);

  const handleDiscuter = useCallback(async (order: Order) => {
    Haptics.selectionAsync();
    const dmId  = `order_${order.id}`;
    const dmKey = "@dkd:dm_extra_convs";
    try {
      const raw      = await AsyncStorage.getItem(dmKey);
      const existing: any[] = raw ? JSON.parse(raw) : [];
      if (!existing.find((c: any) => c.id === dmId)) {
        existing.unshift({
          id: dmId, name: order.clientName, initials: order.initials, color: order.color,
          preview: `Commande`, time: "Maintenant", unread: 1, online: true, read: false,
        });
        await AsyncStorage.setItem(dmKey, JSON.stringify(existing));
      }
    } catch {}
    router.push(`/dm-importe?id=${encodeURIComponent(dmId)}&name=${encodeURIComponent(order.clientName)}` as any);
  }, [router]);

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: dBG }]}>

      <View style={[s.header, { backgroundColor: dHEAD, borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Mes commandes</Text>
          {pendingCount > 0 && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[s.searchWrap, { backgroundColor: dCARD2, borderColor: dBORDER }]}>
        <Ionicons name="search-outline" size={15} color={dMUTED} />
        <TextInput
          style={[s.searchInput, { color: dTEXT }]}
          placeholder="Rechercher..."
          placeholderTextColor={dMUTED}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={15} color={dMUTED} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[s.tabsRow, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "pending" && [s.tabBtnActive, { backgroundColor: dCARD2 }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("pending"); }}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, { color: tab === "pending" ? dTEXT : dMUTED }]}>En attente</Text>
          {pendingCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: ACCENT }]}>
              <Text style={s.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === "confirmed" && [s.tabBtnActive, { backgroundColor: dCARD2 }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("confirmed"); }}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, { color: tab === "confirmed" ? dTEXT : dMUTED }]}>Confirmé</Text>
          {confirmedCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: "#22C55E" }]}>
              <Text style={s.tabBadgeText}>{confirmedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="archive-outline" size={52} color={dMUTED} />
            <Text style={[s.emptyText, { color: dMUTED }]}>
              {tab === "pending" ? "Aucune commande en attente" : "Aucune commande confirmée"}
            </Text>
          </View>
        )}
        {filtered.map((order) => {
          const src = order.source ? SOURCE_CONFIG[order.source] : null;
          return (
            <View key={order.id} style={[s.card, { backgroundColor: dCARD, borderColor: dBORDER }]}>

              {src && (
                <View style={[s.sourceBadge, { backgroundColor: src.color + "16", borderColor: src.color + "35" }]}>
                  <Ionicons name={src.icon as any} size={11} color={src.color} />
                  <Text style={[s.sourceBadgeText, { color: src.color }]}>{src.label}</Text>
                </View>
              )}

              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: order.color + "22" }]}>
                  <Text style={[s.avatarText, { color: order.color }]}>{order.initials}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.clientName, { color: dTEXT }]}>{order.clientName}</Text>
                </View>
                <View style={s.cardRight}>
                  <Text style={[s.cardPrice, tab === "confirmed" && { color: "#22C55E" }]}>{order.price}</Text>
                  <Text style={[s.cardTime, { color: dMUTED }]}>{order.time}</Text>
                </View>
              </View>

              {tab === "confirmed" && (
                <View style={s.confirmedRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                  <Text style={s.confirmedText}>Commande confirmée</Text>
                </View>
              )}

              <View style={s.actionsRow}>
                <TouchableOpacity
                  style={[s.actionBtnGhost, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: dBORDER }]}
                  onPress={() => openDetail(order)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="eye-outline" size={15} color={dSUB} />
                  <Text style={[s.actionBtnGhostText, { color: dSUB }]}>Voir</Text>
                </TouchableOpacity>
                {tab === "pending" && (
                  <>
                    <TouchableOpacity
                      style={[s.actionBtnColor, { backgroundColor: "#3B82F618", borderColor: "#3B82F640" }]}
                      onPress={() => handleDiscuter(order)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={15} color="#3B82F6" />
                      <Text style={[s.actionBtnColorText, { color: "#3B82F6" }]}>Discuter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtnColor, { backgroundColor: "#22C55E18", borderColor: "#22C55E40" }]}
                      onPress={() => confirmOrder(order.id)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color="#22C55E" />
                      <Text style={[s.actionBtnColorText, { color: "#22C55E" }]}>Confirmer</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {detailOrder && (
        <CommandeDetailModal
          visible={detailOpen}
          onClose={() => { setDetailOpen(false); setDetailOrder(null); }}
          products={detailOrder.products}
          isConfirmed={detailOrder.status === "confirmed"}
          onCancel={() => cancelOrder(detailOrder.id)}
          isDark={isDark}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1 },
  header:             { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:            { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter:       { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:        { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 17 },
  headerBadge:        { backgroundColor: "#C0392B", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  headerBadgeText:    { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  searchWrap:         { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1 },
  searchInput:        { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  tabsRow:            { flexDirection: "row", marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, padding: 4, gap: 4 },
  tabBtn:             { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  tabBtnActive:       {},
  tabBtnText:         { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge:           { borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText:       { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  emptyState:         { alignItems: "center", paddingTop: 80, gap: 14 },
  emptyText:          { fontFamily: "Poppins_400Regular", fontSize: 14 },
  card:               { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, gap: 10 },
  sourceBadge:        { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  sourceBadgeText:    { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  cardTop:            { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:             { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:         { fontFamily: "Poppins_700Bold", fontSize: 15 },
  cardInfo:           { flex: 1 },
  clientName:         { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  cardRight:          { alignItems: "flex-end", gap: 3 },
  cardPrice:          { color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 15 },
  cardTime:           { fontFamily: "Poppins_400Regular", fontSize: 11 },
  confirmedRow:       { flexDirection: "row", alignItems: "center", gap: 6 },
  confirmedText:      { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  actionsRow:         { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtnGhost:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionBtnGhostText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  actionBtnColor:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionBtnColorText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
});
